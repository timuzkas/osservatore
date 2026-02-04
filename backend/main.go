package main

import (
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/timuzkas/osservatore/backend/internal/models"
	"github.com/timuzkas/osservatore/backend/internal/service"
)

func main() {
	e := echo.New()

	// Manager
	mgr := service.NewManager("services.json")

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// API Routes
	api := e.Group("/api")
	
	api.GET("/services", func(c echo.Context) error {
		return c.JSON(http.StatusOK, mgr.ListServices())
	})

	api.POST("/services/:id/action", func(c echo.Context) error {
		id := c.Param("id")
		action := c.QueryParam("type")
		
		// Find service
		var target *models.Service
		for _, s := range mgr.ListServices() {
			if s.ID == id {
				target = &s
				break
			}
		}
		
		if target == nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "service not found"})
		}

		provider, ok := mgr.GetProvider(target.Type)
		if !ok {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "provider not found"})
		}

		var err error
		switch action {
		case "start":
			err = provider.Start(target)
		case "stop":
			err = provider.Stop(target)
		case "restart":
			err = provider.Restart(target)
		case "update":
			err = provider.Update(target)
		default:
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid action"})
		}

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		return c.JSON(http.StatusOK, map[string]string{"status": "success"})
	})

	// Add or Update service
	api.POST("/services", func(c echo.Context) error {
		var s models.Service
		if err := c.Bind(&s); err != nil {
			return err
		}
		if err := mgr.AddOrUpdateService(s); err != nil {
			return err
		}
		return c.JSON(http.StatusOK, s)
	})

	// Delete service
	api.DELETE("/services/:id", func(c echo.Context) error {
		id := c.Param("id")
		if err := mgr.DeleteService(id); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
