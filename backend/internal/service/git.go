package service

import (
	"fmt"
	"os/exec"
	"strings"
)

func gitUpdate(repoPath string, branch string) error {
	if repoPath == "" {
		return fmt.Errorf("repo path is empty")
	}

	// 1. Fetch
	cmdFetch := exec.Command("git", "fetch", "--all")
	cmdFetch.Dir = repoPath
	if err := cmdFetch.Run(); err != nil {
		return fmt.Errorf("git fetch failed: %w", err)
	}

	// 2. Checkout
	cmdCheckout := exec.Command("git", "checkout", branch)
	cmdCheckout.Dir = repoPath
	if err := cmdCheckout.Run(); err != nil {
		return fmt.Errorf("git checkout %s failed: %w", branch, err)
	}

	// 3. Pull
	cmdPull := exec.Command("git", "pull", "origin", branch)
	cmdPull.Dir = repoPath
	if err := cmdPull.Run(); err != nil {
		return fmt.Errorf("git pull failed: %w", err)
	}

	return nil
}

func runCommands(dir string, commands []string) error {
	for _, c := range commands {
		args := strings.Fields(c)
		if len(args) == 0 {
			continue
		}
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Dir = dir
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("command %s failed: %w", c, err)
		}
	}
	return nil
}
