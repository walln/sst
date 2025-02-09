package deployer

import (
	"context"
	"log/slog"
	"reflect"

	"github.com/sst/sst/v3/cmd/sst/mosaic/errors"
	"github.com/sst/sst/v3/cmd/sst/mosaic/watcher"
	"github.com/sst/sst/v3/internal/util"
	"github.com/sst/sst/v3/pkg/bus"
	"github.com/sst/sst/v3/pkg/project"
	"github.com/sst/sst/v3/pkg/server"
)

type DeployRequestedEvent struct{}
type DeployFailedEvent struct {
	Error string
}

func Start(ctx context.Context, p *project.Project, server *server.Server) error {
	log := slog.Default().With("service", "deployer")
	log.Info("starting")
	defer log.Info("done")
	watchedFiles := make(map[string]bool)
	events := bus.Subscribe(ctx, &watcher.FileChangedEvent{}, &DeployRequestedEvent{}, &project.BuildSuccessEvent{})
	lastBuildHash := ""
	for {
		log.Info("waiting for trigger")
		select {
		case <-ctx.Done():
			return nil
		case evt := <-events:
			switch evt := evt.(type) {
			case *project.BuildSuccessEvent:
				lastBuildHash = evt.Hash
				log.Info("build hash", "hash", lastBuildHash)
				for _, file := range evt.Files {
					watchedFiles[file] = true
				}
				continue
			case *watcher.FileChangedEvent, *DeployRequestedEvent:
				if evt, ok := evt.(*watcher.FileChangedEvent); !ok || watchedFiles[evt.Path] {
					log.Info("deploying")
					err := p.Run(ctx, &project.StackInput{
						Command:    "deploy",
						Dev:        true,
						ServerPort: server.Port,
						SkipHash:   lastBuildHash,
					})
					if err != nil {
						log.Error("stack deploy error", "error", err)
						transformed := errors.Transform(err)
						if _, ok := transformed.(*util.ReadableError); ok && transformed.Error() != "" {
							bus.Publish(&DeployFailedEvent{Error: transformed.Error()})
						}
					}
				}
			}
			continue
		}
	}
}

func publishFields(v interface{}) {
	val := reflect.ValueOf(v)

	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		bus.Publish(v)
		return
	}

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		switch field.Kind() {
		case reflect.Struct:
			publishFields(field.Interface())
			break
		case reflect.Ptr, reflect.Interface, reflect.Slice, reflect.Map, reflect.Chan, reflect.Func:
			if !field.IsNil() {
				bus.Publish(field.Interface())
			}
			break
		default:
			// bus.Publish(field.Interface())
		}
	}
}
