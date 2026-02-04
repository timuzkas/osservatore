package service

import (
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

func (p *PodmanProvider) Update(s *models.Service) error {
	if s.UpdateConfig.RepoURL != "" {
		if err := exec.Command("podman", "pull", s.UpdateConfig.RepoURL).Run(); err != nil {
			return err
		}
	}
	return p.Restart(s)
}
