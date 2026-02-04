package main

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/timuzkas/osservatore/backend/internal/models"
	"github.com/timuzkas/osservatore/backend/internal/service"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// WSWriter wraps a websocket connection to implement io.Writer
type WSWriter struct {
	conn *websocket.Conn
}

func (w *WSWriter) Write(p []byte) (n int, err error) {
	err = w.conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func main() {
	e := echo.New()
	mgr := service.NewManager("services.json")

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	api := e.Group("/api")
	
	api.GET("/services", func(c echo.Context) error {
		return c.JSON(http.StatusOK, mgr.ListServices())
	})

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

	api.DELETE("/services/:id", func(c echo.Context) error {
		id := c.Param("id")
		if err := mgr.DeleteService(id); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.NoContent(http.StatusNoContent)
	})

	api.POST("/services/:id/action", func(c echo.Context) error {
		id := c.Param("id")
		action := c.QueryParam("type")
		
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

		// Non-blocking actions
		switch action {
		case "start":
			provider.Start(target)
		case "stop":
			provider.Stop(target)
		case "restart":
			provider.Restart(target)
		case "update":
			return c.JSON(http.StatusOK, map[string]string{"status": "ready_for_ws"})
		default:
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid action"})
		}

		return c.JSON(http.StatusOK, map[string]string{"status": "success"})
	})

	// WebSocket for deployment logs
	e.GET("/api/ws/deploy/:id", func(c echo.Context) error {
		ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
		if err != nil {
			return err
		}
		defer ws.Close()

		id := c.Param("id")
		var target *models.Service
		for _, s := range mgr.ListServices() {
			if s.ID == id {
				target = &s
				break
			}
		}

		if target == nil {
			ws.WriteMessage(websocket.TextMessage, []byte("Error: Service not found"))
			return nil
		}

		provider, ok := mgr.GetProvider(target.Type)
		if !ok {
			ws.WriteMessage(websocket.TextMessage, []byte("Error: Provider not found"))
			return nil
		}

		writer := &WSWriter{conn: ws}
		if err := provider.Update(target, writer); err != nil {
			fmt.Fprintf(writer, "\nDeployment Failed: %v\n", err)
		} else {
			fmt.Fprintf(writer, "\nDeployment Successful!\n")
		}

		return nil
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3014"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
