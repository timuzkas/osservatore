package service

import (
	"fmt"
	"io"
	"os/exec"
	"strings"

	"github.com/timuzkas/osservatore/backend/internal/models"
)

type PM2Provider struct{}

func (p *PM2Provider) Start(s *models.Service) error {
	return exec.Command("pm2", "start", s.ID).Run()
}

func (p *PM2Provider) Stop(s *models.Service) error {
	return exec.Command("pm2", "stop", s.ID).Run()
}

func (p *PM2Provider) Restart(s *models.Service) error {
	return exec.Command("pm2", "restart", s.ID).Run()
}

func (p *PM2Provider) Status(s *models.Service) (models.ServiceStatus, error) {
	cmd := exec.Command("pm2", "jlist")
	out, err := cmd.Output()
	if err != nil {
		return models.StatusUnknown, err
	}

	if strings.Contains(string(out), s.ID) && strings.Contains(string(out), "online") {
		return models.StatusRunning, nil
	}
	return models.StatusStopped, nil
}

func (p *PM2Provider) GetLogs(s *models.Service) ([]string, error) {
	cmd := exec.Command("pm2", "logs", s.ID, "--lines", "100", "--nostream")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return strings.Split(string(out), "\n"), nil
}

func (p *PM2Provider) Update(s *models.Service, w io.Writer) error {
	fmt.Fprintf(w, "Starting PM2 update for %s\n", s.Name)
	
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

	fmt.Fprintf(w, "Restarting app...\n")
	return p.Restart(s)
}
