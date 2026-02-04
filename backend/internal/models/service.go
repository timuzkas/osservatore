package models

import "time"

type ServiceStatus string

const (
	StatusRunning  ServiceStatus = "running"
	StatusStopped  ServiceStatus = "stopped"
	StatusError    ServiceStatus = "error"
	StatusUpdating ServiceStatus = "updating"
	StatusUnknown  ServiceStatus = "unknown"
)

type ProviderType string

const (
	ProviderSystemd ProviderType = "systemd"
	ProviderPM2     ProviderType = "pm2"
	ProviderPodman  ProviderType = "podman"
	ProviderDocker  ProviderType = "docker"
)

type Service struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Type         ProviderType  `json:"type"`
	Status       ServiceStatus `json:"status"`
	Path         string        `json:"path"`
	Description  string        `json:"description"`
	Icon         string        `json:"icon"`  // e.g., "terminal", "cpu", "box", "globe", "database"
	Color        string        `json:"color"` // e.g., "blue", "emerald", "violet", "orange", "rose"
	UpdateConfig UpdateConfig  `json:"update_config"`
	LastUpdated  time.Time     `json:"last_updated"`
}

type UpdateConfig struct {
	RepoURL      string   `json:"repo_url"`
	Branch       string   `json:"branch"`
	PreUpdate    []string `json:"pre_update"`    // Commands to run before pull
	PostUpdate   []string `json:"post_update"`   // Commands to run after pull (build/restart)
	BuildCommand string   `json:"build_command"` // Main build command
}

type ServiceProvider interface {
	Start(s *Service) error
	Stop(s *Service) error
	Restart(s *Service) error
	Status(s *Service) (ServiceStatus, error)
	GetLogs(s *Service) ([]string, error)
	Update(s *Service) error
}
