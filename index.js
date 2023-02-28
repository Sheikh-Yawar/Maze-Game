const newGame = document.querySelector(".new-game");
const level = document.querySelector(".level");
const color = document.querySelector(".color");
const gravity = document.querySelector(".gravity");

// Checking whether website is opened on phone or desktop
let endSystem = navigator.userAgent;
let regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = regexp.test(endSystem);
let numParticles;
if (isMobileDevice) {
  document.querySelector(".wrapper").style.display = "flex";
}
const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } =
  Matter;

const width = window.innerWidth;
const height =
  window.innerHeight - document.querySelector("main").offsetTop - 20;

// Dimension of the grid
let rows = 14;
let columns = 12;

//Create a new instance of engine
const engine = Engine.create();

// Disable Gravity
engine.world.gravity.y = 0;

//Get the world object that gets created with engine.
const { world } = engine;

//configuration regarding where to render
const render = Render.create({
  //appends the canvas to body
  element: document.querySelector("main"),
  engine,
  options: {
    wireframes: false,
    width: width,
    height: height,
    background: "white",
  },
});

//Awaken the render element, and tell it to draw
Render.run(render);
//Transfer the state of world from A to B
Runner.run(Runner.create(), engine);

const wallWidth = 5;
//Making Walls

//Shuffle the neighbors
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    //Swapping
    [arr[index], arr[counter]] = [arr[counter], arr[index]];
  }
  return arr;
};

// Delete the whole game
function delGame() {
  Composite.clear(world);
}

// Creating mazeGame
function mazeGame(cellsHorizontal, cellsVertical) {
  const walls = [
    Bodies.rectangle(width / 2, 0, width, wallWidth, {
      render: {
        fillStyle: "black",
      },
      friction: 0,
      isStatic: true,
    }),
    Bodies.rectangle(width / 2, height, width, wallWidth, {
      // angle: Math.PI/4,
      render: {
        fillStyle: "black",
      },
      friction: 0,
      isStatic: true,
    }),
    Bodies.rectangle(0, height / 2, wallWidth, height, {
      render: {
        fillStyle: "black",
      },
      isStatic: true,
    }),
    Bodies.rectangle(width, height / 2, wallWidth, height, {
      render: {
        fillStyle: "black",
      },
      isStatic: true,
    }),
  ];

  // add the new changes to World object
  World.add(world, walls);

  //Dimensions of wall
  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  //Maze Generation
  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  //Vertical walls
  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  //Horizontal walls
  const Horizontals = Array(cellsHorizontal - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startCol = Math.floor(Math.random() * cellsHorizontal);

  const stepThroughCell = (row, col) => {
    // If i have visited the cell ar [row, column], then reurn
    if (grid[row][col]) {
      return;
    }

    //Mark the cell as visited if not visited
    grid[row][col] = true;

    //Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, col, "up"],
      [row, col + 1, "right"],
      [row + 1, col, "down"],
      [row, col - 1, "left"],
    ]);

    //For each neighbor........
    for (let neighbor of neighbors) {
      const [nextRow, nextCol, direction] = neighbor;

      // See if that neighbor is out of bounds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextCol < 0 ||
        nextCol >= cellsHorizontal
      ) {
        continue;
      }
      //If we have visited that neighbor, continue to next neighbor
      if (grid[nextRow][nextCol]) {
        continue;
      }
      //Remove a wall from either Horizontals or verticals
      if (direction == "left") {
        verticals[row][col - 1] = true;
      } else if (direction == "right") {
        verticals[row][col] = true;
      } else if (direction == "up") {
        Horizontals[row - 1][col] = true;
      } else if (direction == "down") {
        Horizontals[row][col] = true;
      }
      // Visit that next cell
      stepThroughCell(nextRow, nextCol);
    }
  };

  stepThroughCell(startRow, startCol);

  //Making walls using Matter JS
  Horizontals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
      if (open) {
        return;
      }
      const xCord = colIndex * unitLengthX + unitLengthX / 2;
      const yCord = rowIndex * unitLengthY + unitLengthY;
      const wall = Bodies.rectangle(xCord, yCord, unitLengthX + 10, 10, {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "black",
        },
      });

      World.add(world, wall);
    });
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
      if (open) {
        return;
      }
      const xCord = colIndex * unitLengthX + unitLengthX;
      const yCord = rowIndex * unitLengthY + unitLengthY / 2;
      const wall = Bodies.rectangle(xCord, yCord, 10, unitLengthY, {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "black",
        },
      });

      World.add(world, wall);
    });
  });

  // Making Goal
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      isStatic: true,
      label: "goal",
      render: {
        fillStyle: "red",
      },
    }
  );

  World.add(world, goal);

  //Adding Ball
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 6;
  const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
    label: "ball",
    render: {
      fillStyle: "red",
    },
    restitution: 1,
  });
  World.add(world, ball);
  // Handling KeyPresses to move the ball
  window.addEventListener("keydown", (e) => {
    const keyPressed = e.key.toLowerCase();
    console.log(keyPressed);
    // Get currrent ball velocity
    const { x, y } = ball.velocity;
    if (keyPressed === "w" || keyPressed === "arrowup") {
      Body.setVelocity(ball, {
        x,
        y: y - 3,
      });
    }
    if (keyPressed === "d" || keyPressed === "arrowright") {
      Body.setVelocity(ball, {
        x: x + 3,
        y,
      });
    }
    if (keyPressed === "s" || keyPressed === "arrowdown") {
      Body.setVelocity(ball, {
        x,
        y: y + 3,
      });
    }
    if (keyPressed === "a" || keyPressed === "arrowleft") {
      Body.setVelocity(ball, {
        x: x - 3,
        y: y,
      });
    }
  });
  // Detecting a win: or collision between ball and goal
  Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach((collision) => {
      const labels = ["ball", "goal"];
      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        document.querySelector(".winner").classList.remove("hidden");
        world.gravity.y = 1;
        world.bodies.forEach((body) => {
          if (body.label === "wall") {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });
}

mazeGame(rows, columns);

// New Game
newGame.addEventListener("click", () => {
  delGame();
  engine.world.gravity.y = 0;
  rows = parseInt(level.querySelector("input").value);
  columns = rows - 2;
  console.log(rows, columns);
  gravity.querySelector("select").value = 0;
  mazeGame(rows, columns);
});

// Change level
level.addEventListener("input", (e) => {
  delGame();
  rows = parseInt(e.target.value);
  columns = rows - 2;
  // Disable Gravity
  engine.world.gravity.y = 0;
  gravity.querySelector("select").value = 0;
  mazeGame(rows, columns);
});

//change background
color.addEventListener("input", (e) => {
  render.options.background = e.target.value;
});

//enable Gravity
gravity.addEventListener("input", (e) => {
  engine.world.gravity.y = parseInt(e.target.value);
});
