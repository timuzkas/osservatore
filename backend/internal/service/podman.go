package service

import (
	"fmt"
	"io"
	"os/exec"
	"strings"

	"github.com/timuzkas/osservatore/backend/internal/models"
)

type PodmanProvider struct{}

func (p *PodmanProvider) Start(s *models.Service) error {
	return exec.Command("podman", "start", s.ID).Run()
}

func (p *PodmanProvider) Stop(s *models.Service) error {
	return exec.Command("podman", "stop", s.ID).Run()
}

func (p *PodmanProvider) Restart(s *models.Service) error {
	return exec.Command("podman", "restart", s.ID).Run()
}

func (p *PodmanProvider) Status(s *models.Service) (models.ServiceStatus, error) {
	cmd := exec.Command("podman", "inspect", s.ID, "--format", "{{.State.Status}}")
	out, err := cmd.Output()
	if err != nil {
		return models.StatusUnknown, err
	}

	statusStr := strings.TrimSpace(string(out))
	if statusStr == "running" {
		return models.StatusRunning, nil
	}
	return models.StatusStopped, nil
}

func (p *PodmanProvider) GetLogs(s *models.Service) ([]string, error) {
	cmd := exec.Command("podman", "logs", "--tail", "100", s.ID)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return strings.Split(string(out), "\n"), nil
}

func (p *PodmanProvider) Update(s *models.Service, w io.Writer) error {
	fmt.Fprintf(w, "Starting Podman update for %s\n", s.Name)
	
	if err := runCommands(s.Path, s.UpdateConfig.PreUpdate, w); err != nil {
		return err
	}

	if s.UpdateConfig.RepoURL != "" {
		fmt.Fprintf(w, "Pulling image: %s\n", s.UpdateConfig.RepoURL)
		cmd := exec.Command("podman", "pull", s.UpdateConfig.RepoURL)
		cmd.Stdout = w
		cmd.Stderr = w
		if err := cmd.Run(); err != nil {
			return err
		}
	}

	if s.UpdateConfig.BuildCommand != "" {
		fmt.Fprintf(w, "Building...\n")
		if err := runCommands(s.Path, []string{s.UpdateConfig.BuildCommand}, w); err != nil {
			return err
		}
	}

	if err := runCommands(s.Path, s.UpdateConfig.PostUpdate, w); err != nil {
		return err
	}

	fmt.Fprintf(w, "Restarting container...\n")
	return p.Restart(s)
}
