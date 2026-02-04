package service

import (
	"fmt"
	"io"
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

func (p *SystemdProvider) Update(s *models.Service, w io.Writer) error {
	fmt.Fprintf(w, "Starting Systemd update for %s\n", s.Name)
	
	if err := runCommands(s.Path, s.UpdateConfig.PreUpdate, w); err != nil {
		return err
	}

	if s.UpdateConfig.RepoURL != "" {
		if err := gitUpdate(s.Path, s.UpdateConfig.Branch, w); err != nil {
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

	fmt.Fprintf(w, "Restarting service...\n")
	return p.Restart(s)
}
