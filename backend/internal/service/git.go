package service

import (
	"fmt"
	"io"
	"os/exec"
	"strings"
)

func gitUpdate(repoPath string, branch string, w io.Writer) error {
	if repoPath == "" {
		return fmt.Errorf("repo path is empty")
	}

	steps := []struct {
		name string
		args []string
	}{
		{"Fetching", []string{"fetch", "--all"}},
		{"Checking out", []string{"checkout", branch}},
		{"Pulling", []string{"pull", "origin", branch}},
	}

	for _, step := range steps {
		fmt.Fprintf(w, "▸ %s...\n", step.name)
		cmd := exec.Command("git", step.args...)
		cmd.Dir = repoPath
		cmd.Stdout = w
		cmd.Stderr = w
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("git %s failed: %w", step.name, err)
		}
	}

	return nil
}

func runCommands(dir string, commands []string, w io.Writer) error {
	for _, c := range commands {
		fmt.Fprintf(w, "▸ Executing: %s\n", c)
		args := strings.Fields(c)
		if len(args) == 0 {
			continue
		}
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Dir = dir
		cmd.Stdout = w
		cmd.Stderr = w
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("command %s failed: %w", c, err)
		}
	}
	return nil
}
