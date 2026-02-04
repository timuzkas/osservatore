package service

import (
	"os/exec"
	"strings"

	"github.com/timuzkas/osservatore/backend/internal/models"
)

type SystemdProvider struct{}

func (p *SystemdProvider) Start(s *models.Service) error {
	return exec.Command("systemctl", "start", s.ID).Run()
}

func (p *SystemdProvider) Stop(s *models.Service) error {
	return exec.Command("systemctl", "stop", s.ID).Run()
}

func (p *SystemdProvider) Restart(s *models.Service) error {
	return exec.Command("systemctl", "restart", s.ID).Run()
}

func (p *SystemdProvider) Status(s *models.Service) (models.ServiceStatus, error) {
	cmd := exec.Command("systemctl", "is-active", s.ID)
	out, _ := cmd.Output()
	statusStr := strings.TrimSpace(string(out))

	switch statusStr {
	case "active":
		return models.StatusRunning, nil
	case "inactive", "failed":
		return models.StatusStopped, nil
	default:
		return models.StatusUnknown, nil
	}
}

func (p *SystemdProvider) GetLogs(s *models.Service) ([]string, error) {
	cmd := exec.Command("journalctl", "-u", s.ID, "-n", "100", "--no-pager")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return strings.Split(string(out), "\n"), nil
}

func (p *SystemdProvider) Update(s *models.Service) error {
	// 1. Pre-update
	if err := runCommands(s.Path, s.UpdateConfig.PreUpdate); err != nil {
		return err
	}

	// 2. Git update
	if s.UpdateConfig.RepoURL != "" {
		if err := gitUpdate(s.Path, s.UpdateConfig.Branch); err != nil {
			return err
		}
	}

	// 3. Post-update / Build
	if s.UpdateConfig.BuildCommand != "" {
		if err := runCommands(s.Path, []string{s.UpdateConfig.BuildCommand}); err != nil {
			return err
		}
	}
	if err := runCommands(s.Path, s.UpdateConfig.PostUpdate); err != nil {
		return err
	}

	// 4. Restart
	return p.Restart(s)
}
