package python

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"github.com/BurntSushi/toml"
	"github.com/sst/ion/pkg/process"
	"github.com/sst/ion/pkg/project/path"
	"github.com/sst/ion/pkg/runtime"
)

type Worker struct {
	stdout io.ReadCloser
	stderr io.ReadCloser
	cmd    *exec.Cmd
}

func (w *Worker) Stop() {
	// Terminate the whole process group
	process.Kill(w.cmd.Process)
}

func (w *Worker) Logs() io.ReadCloser {
	reader, writer := io.Pipe()

	go func() {
		defer writer.Close()

		var wg sync.WaitGroup
		wg.Add(2)

		copyStream := func(dst io.Writer, src io.Reader, name string) {
			defer wg.Done()
			buf := make([]byte, 1024)
			for {
				n, err := src.Read(buf)
				if n > 0 {
					_, werr := dst.Write(buf[:n])
					if werr != nil {
						slog.Error("error writing to pipe", "stream", name, "err", werr)
						return
					}
				}
				if err != nil {
					if err != io.EOF {
						slog.Error("error reading from stream", "stream", name, "err", err)
					}
					return
				}
			}
		}

		go copyStream(writer, w.stdout, "stdout")
		go copyStream(writer, w.stderr, "stderr")

		wg.Wait()
	}()

	return reader
}

type PythonRuntime struct {
	lastBuiltHandler map[string]string
}

func New() *PythonRuntime {
	return &PythonRuntime{
		lastBuiltHandler: map[string]string{},
	}
}

func (r *PythonRuntime) Build(ctx context.Context, input *runtime.BuildInput) (*runtime.BuildOutput, error) {
	/// Building a python function works as follows:
	/// 1. Locate the workspace that the handler resides in
	///		We can do this by resolving the parent pyproject.toml file
	/// 2. Copy the pyproject.toml file to the output directory

	/// Workspaces are the most challenging part of the build process
	/// UV currently does not support --include-workspace-deps for builds
	/// See: https://github.com/astral-sh/uv/issues/6935 hopefully this lands soon

	/// As a result, we have to manually construct the dependency tree
	/// So we need to:
	///
	/// 1. Identify the entrypoint workspace
	/// 2. Parse the workspace graph using the root pyproject.toml
	/// 3. Use this graph to find the minimum set of workspaces to include
	/// 4. Build each workspace as an sdist
	/// 5. Copy each sdist to the same level such that the artifact is:
	///		/{artifact-dir}/entrypoint-workspace/*
	///		/{artifact-dir}/dependency-a/*
	///		/{artifact-dir}/dependency-b/*
	///		...
	///		/{artifact-dir}/transitive-dep-a/*
	///		/{artifact-dir}/transitive-dep-b/*
	///		...
	/// 6. Export the requirements.txt file for the entrypoint workspace to compile all
	///		non-local dependencies into a single requirements.txt file
	/// 7. Pip install the requirements.txt file into the artifact directory using a
	///		install target (pip install -t ...)

	/// If in dev mode then we need to copy the lambda bridge into the build artifact
	/// so that we can run from the project without having to manually isolate the runtime

	/// If in deployment mode then we need to:
	/// 1. Sync the dependencies with uv
	/// 2. Convert the virtualenv to site-packages so that lambda can find the packages
	/// 3. Remove the virtualenv because it does not need to be included in the zip

	slog.Info("building python function", "handler", input.Handler, "out", input.Out())

	file, ok := r.getFile(input)
	if !ok {
		return nil, fmt.Errorf("handler not found: %v", input.Handler)
	}

	// FOR DEV AND FOR ZIP BUILDS:
	workingDir := path.ResolveRootDir(input.CfgPath)

	// 1. Generate non-local package index
	syncCmd := process.CommandContext(ctx, "uv", "sync", "--all-packages")
	syncCmd.Dir = workingDir
	slog.Info("running uv sync in dir", "dir", syncCmd.Dir)

	// capture the output of the sync command
	syncOutput, err := syncCmd.CombinedOutput()
	if err != nil {
		slog.Error("failed to run uv sync", "error", err, "output", string(syncOutput))
		return nil, fmt.Errorf("failed to run uv sync: %v", err)
	}
	slog.Error("uv sync output", "output", string(syncOutput))

	// err := syncCmd.Run()
	// if err != nil {
	// 	slog.Error("failed to run uv sync", "error", err)
	// 	return nil, fmt.Errorf("failed to run uv sync: %v", err)
	// }

	outputRequirementsFile := filepath.Join(input.Out(), "requirements.txt")
	exportCmd := process.CommandContext(ctx, "uv", "export", "--all-packages", "--output-file="+outputRequirementsFile, "--no-emit-workspace")
	exportCmd.Dir = workingDir
	err = exportCmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to run uv export: %v", err)
	}

	// 2. Build the entire workspace - this should cache and be fast thank you astral
	buildCmd := process.CommandContext(ctx, "uv", "build", "--all", "--sdist", "--out-dir="+input.Out())
	buildCmd.Dir = workingDir
	err = buildCmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to run uv build: %v", err)
	}

	// 3. Decode each tar.gz file in the dist directory and remove the trailing "-{version}"
	files, err := filepath.Glob(filepath.Join(input.Out(), "*.tar.gz"))
	if err != nil {
		return nil, fmt.Errorf("failed to glob tar.gz files: %v", err)
	}

	for _, file := range files {
		// Extract the tar.gz file
		cmd := process.CommandContext(ctx, "tar", "-xzf", file, "-C", input.Out())
		cmd.Dir = input.Out()
		err = cmd.Run()
		if err != nil {
			return nil, fmt.Errorf("failed to extract tar.gz file: %v", err)
		}

		// Get the directory name without version number
		dirName := strings.TrimSuffix(filepath.Base(file), ".tar.gz")
		lastHyphen := strings.LastIndex(dirName, "-")
		baseName := dirName[:lastHyphen]

		extractedDir := filepath.Join(input.Out(), dirName)
		targetDir := filepath.Join(input.Out(), baseName)

		// Check if the package has a src/{package_name} structure
		srcPath := filepath.Join(extractedDir, "src", baseName)
		if _, err := os.Stat(srcPath); err == nil {
			// Remove old directory if it exists
			if err := os.RemoveAll(targetDir); err != nil {
				return nil, fmt.Errorf("failed to remove old directory: %v", err)
			}
			// Move the contents from src/{package_name} directly to the target
			if err := os.Rename(srcPath, targetDir); err != nil {
				return nil, fmt.Errorf("failed to move src directory contents: %v", err)
			}
			// Clean up the original extracted directory
			if err := os.RemoveAll(extractedDir); err != nil {
				return nil, fmt.Errorf("failed to clean up extracted directory: %v", err)
			}
		} else {
			// Handle the regular case (no src directory)
			if err := os.RemoveAll(targetDir); err != nil {
				return nil, fmt.Errorf("failed to remove old directory: %v", err)
			}
			if err := os.Rename(extractedDir, targetDir); err != nil {
				return nil, fmt.Errorf("failed to rename directory: %v", err)
			}
		}
	}

	// 4. Remove the tar.gz files (non-recursive)
	for _, file := range files {
		err = os.Remove(file)
		if err != nil {
			return nil, fmt.Errorf("failed to remove tar.gz file: %v", err)
		}
	}

	// 5. Install the dependencies as a target
	installCmd := process.CommandContext(ctx, "uv", "pip", "install", "-r", outputRequirementsFile, "--target", input.Out())
	installCmd.Dir = input.Out()
	err = installCmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to run uv pip install: %v", err)
	}

	// This is a deployment build now we need to:
	///
	/// First determine if this function is being built for a container deployment
	///
	/// If it is a container deployment then we need to:
	/// 1. Copy the Dockerfile to the artifact directory (user provided or default)
	/// 2. Build the container image
	/// 3. Upload the container image to the container registry
	///
	/// If it is a zip deployment then we need to:
	/// 1. Sync the dependencies with uv
	/// 2. Convert the virtualenv to site-packages so that lambda can find the packages
	/// 3. Remove the virtualenv because it does not need to be included in the zip
	r.lastBuiltHandler[input.FunctionID] = file

	errors := []string{}

	// Adjust handler path if it contains the pattern {package_name}/src/{package_name}
	handlerParts := strings.Split(input.Handler, "/")
	if len(handlerParts) >= 3 {
		// Start from the back, using a sliding window of 3
		for i := len(handlerParts) - 3; i >= 0; i-- {
			// Check if we have enough parts left to match the pattern
			if i+2 >= len(handlerParts) {
				continue
			}

			pkgName := handlerParts[i]
			if handlerParts[i+1] == "src" && handlerParts[i+2] == pkgName {
				// Found the pattern, now remove the middle two parts (src/{package_name})
				newParts := append(
					handlerParts[:i+1],
					handlerParts[i+3:]...,
				)
				input.Handler = strings.Join(newParts, "/")
				slog.Info("adjusted handler path", "original", handlerParts, "adjusted", input.Handler)
				break
			}

			// Stop if we would go beyond the project root
			absPath := filepath.Join(path.ResolveRootDir(input.CfgPath), strings.Join(handlerParts[:i], "/"))
			if !strings.HasPrefix(absPath, path.ResolveRootDir(input.CfgPath)) {
				break
			}
		}
	}

	slog.Info("built python function", "HANDLER", input.Handler, "out", input.Out())

	return &runtime.BuildOutput{
		Handler: input.Handler,
		Errors:  errors,
	}, nil
}

func (r *PythonRuntime) Match(runtime string) bool {
	return strings.HasPrefix(runtime, "python")
}

type Source struct {
	URL          string  `toml:"url,omitempty"`
	Git          string  `toml:"git,omitempty"`
	Subdirectory *string `toml:"subdirectory,omitempty"`
	Branch       string  `toml:"branch,omitempty"`
}

type PyProject struct {
	Project struct {
		Dependencies []string `toml:"dependencies"`
	} `toml:"project"`
	Tool struct {
		Uv struct {
			Sources map[string]Source `toml:"sources"`
		} `toml:"uv"`
	} `toml:"tool"`
}

func (r *PythonRuntime) Run(ctx context.Context, input *runtime.RunInput) (runtime.Worker, error) {
	// Get the directory of the Handler
	// handlerDir := filepath.Dir(filepath.Join(input.Build.Out, input.Build.Handler))

	// We have to manually construct the dependencies to install because uv currently does not support importing a
	// foreign pyproject.toml as a configuration file and we have to run the python-runtime file rather than
	// the handler file

	// Get the absolute path of the pyproject.toml file
	// pyprojectFile, err := FindClosestPyProjectToml(handlerDir)
	pyprojectFile := ""
	// if err != nil {
	// 	return nil, err
	// }

	// Decode the TOML file
	var pyProject PyProject
	if _, err := toml.DecodeFile(pyprojectFile, &pyProject); err != nil {
		slog.Error("Error decoding TOML file", "err", err)
	}

	// Extract the dependencies
	dependencies := pyProject.Project.Dependencies

	// Extract the sources
	sources := pyProject.Tool.Uv.Sources

	args := []string{
		"run",
		"--no-project",
		"--with",
		"requests",
	}

	// We need to check if the dependency is a git dependency
	// If it is, we can confirm if its in the uv.sources as a git dependency
	// then we need to remove it from the dependencies list
	filteredDependencies := []string{}
	// Iterate over each dependency
	for _, dep := range dependencies {
		// Check if the dependency is in the sources map
		if source, exists := sources[dep]; exists {
			if source.Git != "" {
				// It's a Git dependency listed in sources, so skip it
				slog.Debug("Skipping dependency: %s (Git: %s)\n", dep, source.Git)
				continue
			}
		}
		// Add the dependency to the filtered list if it's not a Git dependency
		filteredDependencies = append(filteredDependencies, dep)
	}
	dependencies = filteredDependencies

	for _, dep := range dependencies {
		args = append(args, "--with", dep)
	}

	// If sources are specified, use them
	if len(sources) > 0 {
		for _, source := range sources {
			if source.URL != "" {
				args = append(args, "--find-links", source.URL)
			} else if source.Git != "" {
				repo_url := "git+" + source.Git
				if source.Branch != "" {
					repo_url = repo_url + "@" + source.Branch
				}
				if source.Subdirectory != nil {
					repo_url = repo_url + "#subdirectory=" + *source.Subdirectory
				}
				// uv run --with git+https://github.com/sst/ion.git#subdirectory=sdk/python python.py
				args = append(args, "--with", repo_url)
			}
		}
	}

	args = append(args,
		filepath.Join(path.ResolvePlatformDir(input.CfgPath), "/dist/python-runtime/index.py"),
		filepath.Join(input.Build.Out, input.Build.Handler),
		input.WorkerID,
	)

	cmd := process.CommandContext(
		ctx,
		"uv",
		args...)
	cmd.Env = append(input.Env, "AWS_LAMBDA_RUNTIME_API="+input.Server)
	slog.Info("starting worker", "env", cmd.Env, "args", cmd.Args)
	cmd.Dir = input.Build.Out
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %v", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stderr pipe: %v", err)
	}
	cmd.Start()
	return &Worker{
		stdout,
		stderr,
		cmd,
	}, nil
}

func (r *PythonRuntime) ShouldRebuild(functionID string, file string) bool {
	return true
}

var PYTHON_EXTENSIONS = []string{".py"}

func (r *PythonRuntime) getFile(input *runtime.BuildInput) (string, bool) {
	slog.Info("getting python file", "handler", input.Handler)
	dir := filepath.Dir(input.Handler)
	base := strings.TrimSuffix(filepath.Base(input.Handler), filepath.Ext(input.Handler))
	for _, ext := range PYTHON_EXTENSIONS {
		file := filepath.Join(path.ResolveRootDir(input.CfgPath), dir, base+ext)
		if _, err := os.Stat(file); err == nil {
			return file, true
		}
	}
	return "", false
}

func copyFile(src, dst string) error {
	// Open the source file
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Ensure the destination directory exists
	destDir := filepath.Dir(dst)
	if err := os.MkdirAll(destDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create destination directories for %s: %v", dst, err)
	}

	// Create the destination file
	destinationFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destinationFile.Close()

	// Copy the content from source to destination
	_, err = io.Copy(destinationFile, sourceFile)
	if err != nil {
		return err
	}

	// Flush the writes to stable storage
	err = destinationFile.Sync()
	if err != nil {
		return err
	}

	return nil
}

func copyWorkspace(sourceDir string, artifactDir string) (string, string, error) {
	// Recursively copy all files in a source directory to a destination directory
	var pyprojectPath string

	err := filepath.WalkDir(sourceDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Get the relative path of the file from the input directory
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return fmt.Errorf("failed to get relative path: %v", err)
		}

		// Construct the destination path
		destPath := filepath.Join(artifactDir, relPath)
		if d.IsDir() {
			// Create the directory in the output directory
			return os.MkdirAll(destPath, os.ModePerm)
		}

		// Track pyproject.toml location in the output directory
		if filepath.Base(path) == "pyproject.toml" {
			pyprojectPath = destPath
		}

		// Copy the file to the destination path
		return copyFile(path, destPath)
	})

	if err != nil {
		return "", "", fmt.Errorf("failed to copy workspace: %v", err)
	}

	if pyprojectPath == "" {
		return "", "", fmt.Errorf("pyproject.toml not found in copied workspace")
	}

	return artifactDir, pyprojectPath, nil
}

func getWorkspace(handlerPath string, rootDir string) (string, error) {
	// Get the parent pyproject.toml file of a given python file
	// If the only pyproject.toml file in the rootDir then we need to raise an error

	// Ensure rootDir is an absolute path
	if !filepath.IsAbs(rootDir) {
		return "", fmt.Errorf("rootDir must be an absolute path")
	}

	// Start from the directory of the handler and move up the directory tree
	dir := filepath.Dir(handlerPath)

	// Convert handlerPath's directory to absolute path
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return "", err
	}

	for {
		// If we've reached the root directory then we need to raise an error
		if absDir == rootDir {
			break
		}

		// Check if the pyproject.toml file exists in the current directory
		pyProjectFile := filepath.Join(dir, "pyproject.toml")
		if _, err := os.Stat(pyProjectFile); err == nil {
			return absDir, nil
		}

		// Move up one directory
		parentDir := filepath.Dir(absDir)
		absDir = parentDir
	}

	return "", fmt.Errorf("pyproject.toml not found")
}

func createDevBuild(artifactDir string, pyprojectPath string) {

}
