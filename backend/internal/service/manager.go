package service

import (
	"encoding/json"
	"os"
	"sync"

	"github.com/timuzkas/osservatore/backend/internal/models"
)

type Manager struct {
	services []models.Service
	configPath string
	mu       sync.RWMutex
	providers map[models.ProviderType]models.ServiceProvider
}

func NewManager(configPath string) *Manager {
	m := &Manager{
		configPath: configPath,
		providers: map[models.ProviderType]models.ServiceProvider{
			models.ProviderSystemd: &SystemdProvider{},
			models.ProviderPM2:     &PM2Provider{},
			models.ProviderPodman:  &PodmanProvider{},
		},
	}
	m.load()
	return m
}

func (m *Manager) load() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	data, err := os.ReadFile(m.configPath)
	if err != nil {
		if os.IsNotExist(err) {
			m.services = []models.Service{}
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &m.services)
}

func (m *Manager) save() error {
	data, err := json.MarshalIndent(m.services, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(m.configPath, data, 0644)
}

func (m *Manager) ListServices() []models.Service {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	// Create a deep copy to avoid modifying the original list during status updates
	result := make([]models.Service, len(m.services))
	for i := range m.services {
		result[i] = m.services[i]
		provider, ok := m.providers[result[i].Type]
		if ok {
			status, _ := provider.Status(&result[i])
			result[i].Status = status
		}
	}
	
	return result
}

func (m *Manager) AddOrUpdateService(s models.Service) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	idx := -1
	for i, existing := range m.services {
		if existing.ID == s.ID {
			idx = i
			break
		}
	}
	
	if idx != -1 {
		m.services[idx] = s
	} else {
		m.services = append(m.services, s)
	}
	
	return m.save()
}

func (m *Manager) DeleteService(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	newServices := []models.Service{}
	for _, s := range m.services {
		if s.ID != id {
			newServices = append(newServices, s)
		}
	}
	m.services = newServices
	return m.save()
}

func (m *Manager) GetProvider(t models.ProviderType) (models.ServiceProvider, bool) {
	p, ok := m.providers[t]
	return p, ok
}
