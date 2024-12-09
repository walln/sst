package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	vterm "github.com/mattn/go-libvterm"
	"golang.org/x/term"
)

func main() {
	rows, cols := 10, 100
	vt := vterm.New(rows, cols)
	vt.SetUTF8(true)

	screen := vt.ObtainScreen()

	cmd := exec.Command("zsh")
	ptmx, err := pty.Start(cmd)
	if err != nil {
		panic(err)
	}

	var lock sync.Mutex
	state, err := term.MakeRaw(int(ptmx.Fd()))
	defer term.Restore(int(ptmx.Fd()), state)
	render := func() {
		lock.Lock()
		defer lock.Unlock()
		for row := 0; row < rows; row++ {
			for col := 0; col < cols; col++ {
				cell, _ := screen.GetCellAt(row, col)
				if cell == nil {
					fmt.Printf("\033[0m")
					continue
				}
				fmt.Printf("\033[%d;%dH", row+1, col+1)
				chars := cell.Chars()
				if len(chars) > 0 {
					fmt.Printf("%s", string(chars))
				} else {
					fmt.Printf(" ")
				}
				fmt.Println()
			}
		}
	}

	screen.Reset(true)
	screen.OnDamage = func(rect *vterm.Rect) int {
		render()
		return 1
	}

	go func() {
		io.Copy(ptmx, os.Stdin)
	}()
	io.Copy(vt, ptmx)
}
