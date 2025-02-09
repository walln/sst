package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/sst/sst/v3/cmd/sst/cli"
	"github.com/sst/sst/v3/cmd/sst/mosaic/ui"
	"github.com/sst/sst/v3/internal/util"
	"github.com/sst/sst/v3/pkg/id"
	"github.com/sst/sst/v3/pkg/process"
	"github.com/sst/sst/v3/pkg/project/provider"
	"github.com/sst/sst/v3/pkg/state"
)

var CmdState = &cli.Command{
	Name: "state",
	Description: cli.Description{
		Short: "Manage state of your app",
	},
	Children: []*cli.Command{
		{
			Name:   "edit",
			Hidden: true,
			Description: cli.Description{
				Short: "Edit the state of your app",
			},
			Run: func(c *cli.Cli) error {
				p, err := c.InitProject()
				if err != nil {
					return err
				}
				defer p.Cleanup()

				update, err := p.Lock("edit")
				if err != nil {
					return util.NewReadableError(err, "Could not lock state")
				}
				defer p.Unlock()
				defer func() {
					update.TimeCompleted = time.Now().UTC().Format(time.RFC3339)
					provider.PutUpdate(p.Backend(), p.App().Name, p.App().Stage, update)
				}()
				workdir, err := p.NewWorkdir(update.ID)
				if err != nil {
					return err
				}
				defer workdir.Cleanup()

				path, err := workdir.Pull()
				if err != nil {
					return util.NewReadableError(err, "Could not pull state")
				}
				editor := os.Getenv("EDITOR")
				if editor == "" {
					editor = "vim"
				}
				editorArgs := append(strings.Fields(editor), path)
				fmt.Println(editorArgs)
				cmd := process.Command(editorArgs[0], editorArgs[1:]...)
				cmd.Stdin = os.Stdin
				cmd.Stdout = os.Stdout
				cmd.Stderr = os.Stderr
				if err := cmd.Start(); err != nil {
					return util.NewReadableError(err, "Could not start editor")
				}
				if err := cmd.Wait(); err != nil {
					return util.NewReadableError(err, "Editor exited with error")
				}

				return workdir.Push(update.ID)
			},
		},
		{
			Name: "export",
			Flags: []cli.Flag{
				{
					Name: "decrypt",
					Type: "bool",
					Description: cli.Description{
						Short: "Decrypt the state",
					},
				},
			},
			Description: cli.Description{
				Short: "Prints the state of your app",
				Long: strings.Join([]string{
					"Prints the state of your app.",
					"",
					"This pull the state of your app from the cloud provider and then prints it out.",
					"You can write this to a file or view it directly in your terminal.",
					"",
					"This can be run for specific stages as well.",
					"",
					"```bash frame=\"none\"",
					"sst state export --stage production",
					"```",
					"",
					"By default, it runs on your personal stage.",
				}, "\n"),
			},
			Run: func(c *cli.Cli) error {
				p, err := c.InitProject()
				if err != nil {
					return err
				}
				defer p.Cleanup()
				workdir, err := p.NewWorkdir(id.Descending())
				if err != nil {
					return err
				}
				defer workdir.Cleanup()

				_, err = workdir.Pull()
				if err != nil {
					return util.NewReadableError(err, "Could not pull state")
				}
				exported, err := workdir.Export()
				if err != nil {
					return err
				}
				if c.Bool("decrypt") {
					passphrase, err := provider.Passphrase(p.Backend(), p.App().Name, p.App().Stage)
					if err != nil {
						return err
					}
					exported, err = state.Decrypt(c.Context, passphrase, exported)
					if err != nil {
						return err
					}
				}
				encoder := json.NewEncoder(os.Stdout)
				encoder.SetIndent("", "  ")
				encoder.Encode(exported)
				return err
			},
		},
		{
			Name: "remove",
			Args: []cli.Argument{
				{
					Name:     "target",
					Required: true,
					Description: cli.Description{
						Short: "The name of the resource to remove",
						Long:  "The name of the resource to remove.",
					},
				},
			},
			Description: cli.Description{
				Short: "Remove a resource from only the state",
				Long: strings.Join([]string{
					"Removes the reference for the given resource from the state.",
					"",
					":::note",
					"This does not remove the resource itself.",
					":::",
					"",
					"This does not remove the resource itself, it only edits the state of your app.",
					"",
					"```bash frame=\"none\"",
					"sst state remove MyBucket",
					"```",
					"",
					"Here, `MyBucket` is the name of the resource as defined in your `sst.config.ts`.",
					"",
					"```ts title=\"sst.config.ts\"",
					"new sst.aws.Bucket(\"MyBucket\");",
					"```",
					"",
					"This command will:",
					"",
					"1. Find the resource with the given name in the state.",
					"2. Remove that from the state. It does not remove the children of this resource.",
					"3. Runs a `repair` to remove any dependencies to this resource.",
					"",
					"You can run this for specific stages as well.",
					"",
					"```bash frame=\"none\"",
					"sst state remove MyBucket --stage production",
					"```",
					"",
					"By default, it runs on your personal stage.",
				}, "\n"),
			},
			Run: func(c *cli.Cli) error {
				p, err := c.InitProject()
				if err != nil {
					return err
				}
				defer p.Cleanup()

				update, err := p.Lock("edit")
				if err != nil {
					return util.NewReadableError(err, "Could not lock state")
				}
				defer p.Unlock()
				defer func() {
					update.TimeCompleted = time.Now().UTC().Format(time.RFC3339)
					provider.PutUpdate(p.Backend(), p.App().Name, p.App().Stage, update)
				}()
				workdir, err := p.NewWorkdir(update.ID)
				if err != nil {
					return err
				}
				defer workdir.Cleanup()

				_, err = workdir.Pull()
				if err != nil {
					return util.NewReadableError(err, "Could not pull state")
				}

				checkpoint, err := workdir.Export()
				if err != nil {
					return util.NewReadableError(err, "Could not export state")
				}

				target := c.Positional(0)
				muts := state.Remove(target, checkpoint)
				err = confirmMutations(muts)
				if err != nil {
					return err
				}

				err = workdir.Import(checkpoint)
				if err != nil {
					return util.NewReadableError(err, "Could not import state")
				}

				err = workdir.Push(update.ID)
				if err != nil {
					return err
				}
				ui.Success("Resource removed")
				return nil
			},
		},
		{
			Name: "repair",
			Description: cli.Description{
				Short: "Repair the state of your app",
				Long: strings.Join([]string{
					"Repairs the state of your app if it's corrupted.",
					"",
					"Sometimes, if something goes wrong with your app, or if the state was directly",
					"edited, the state can become corrupted. This will cause your `sst deploy` command",
					"to fail.",
					"",
					"This command looks for the following issues and fixes them.",
					"",
					"1. Since the state is a list of resources, if one resource depends on another,",
					"   it needs to be listed after the one it depends on. This command finds resources",
					"   that depend on each other but are not ordered correctly and **reorders them**.",
					"",
					"2. If resource B depends on resource A, but resource A is not listed in the state,",
					"   it'll **remove the dependency**.",
					"",
					"This command does this by going through all the resources in the state, fixing the",
					"issues and updating the state.",
					"",
					"You can run this for specific stages as well.",
					"",
					"```bash frame=\"none\"",
					"sst state repair --stage production",
					"```",
					"",
					"By default, it runs on your personal stage.",
				}, "\n"),
			},
			Run: func(c *cli.Cli) error {
				p, err := c.InitProject()
				if err != nil {
					return err
				}
				defer p.Cleanup()

				update, err := p.Lock("repair")
				if err != nil {
					return util.NewReadableError(err, "Could not lock state")
				}
				defer p.Unlock()
				defer func() {
					update.TimeCompleted = time.Now().UTC().Format(time.RFC3339)
					provider.PutUpdate(p.Backend(), p.App().Name, p.App().Stage, update)
				}()
				workdir, err := p.NewWorkdir(update.ID)
				if err != nil {
					return err
				}
				defer workdir.Cleanup()

				_, err = workdir.Pull()
				if err != nil {
					return util.NewReadableError(err, "Could not pull state")
				}

				checkpoint, err := workdir.Export()
				if err != nil {
					return util.NewReadableError(err, "Could not export state")
				}

				muts := state.Repair(checkpoint)
				err = confirmMutations(muts)
				if err != nil {
					return err
				}

				// prompt for confirmation to continue
				fmt.Print("Do you want to commit these changes? (y/n): ")
				var response string
				_, err = fmt.Scanln(&response)
				if err != nil {
					return fmt.Errorf("failed to read user input: %w", err)
				}
				if strings.ToLower(response) != "y" {
					return util.NewReadableError(nil, "Cancelled repair")
				}

				err = workdir.Import(checkpoint)
				if err != nil {
					return util.NewReadableError(err, "Could not import state")
				}

				err = workdir.Push(update.ID)
				if err != nil {
					return err
				}
				ui.Success("State repaired")
				return nil
			},
		},
	},
}

func confirmMutations(muts []state.Mutation) error {
	if len(muts) == 0 {
		return util.NewReadableError(nil, "No changes made")
	}
	fmt.Println("Removing:")
	for _, item := range muts {
		if item.Remove != nil {
			fmt.Printf("- %s → %s\n", item.Remove.Resource.Type().DisplayName(), item.Remove.Resource.Name())
		}
		if item.RemoveDependency != nil {
			fmt.Printf("- dependency from %s → %s on %s → %s\n", item.RemoveDependency.Resource.Type().DisplayName(), item.RemoveDependency.Resource.Name(), item.RemoveDependency.Dependency.Type().DisplayName(), item.RemoveDependency.Dependency.Name())
		}
		if item.RemoveProperty != nil {
			fmt.Printf("- property dependency from %s → %s → %s on %s → %s\n", item.RemoveProperty.Resource.URNName(), item.RemoveProperty.Resource.Name(), item.RemoveProperty.Property, item.RemoveProperty.Dependency.Type().DisplayName(), item.RemoveProperty.Dependency.Name())
		}
	}

	// prompt for confirmation to continue
	fmt.Print("Do you want to commit these changes? (y/n): ")
	var response string
	_, err := fmt.Scanln(&response)
	if err != nil {
		return util.NewReadableError(err, "failed to read user input")
	}
	if strings.ToLower(response) != "y" {
		return util.NewReadableError(nil, "Abandoning changes")
	}
	return nil
}
