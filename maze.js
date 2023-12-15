const generateMazeGame = () => {
  const { Engine, World, Render, Runner, Bodies, Body, Events } = Matter;

  const engine = Engine.create();
  engine.world.gravity.y = 0;

  const { world } = engine;

  //constants
  //todo refactor for flexible maze on different screens
  const cellsHorizontal = 7;
  const cellsVertical = 6;
  const width = window.innerWidth;
  const height = window.innerHeight;

  //unitlength for maze wall

  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  const render = Render.create({
    element: document.body,
    engine,
    options: {
      wireframes: false,
      width,
      height,
    },
  });

  Render.run(render);

  Runner.run(Runner.create(), engine);

  //walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 4, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 4, {
      isStatic: true,
    }),
    Bodies.rectangle(0, height / 2, 4, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 4, height, {
      isStatic: true,
    }),
  ];

  World.add(world, walls);

  //maze generation

  const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
      counter--;
      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
    return arr;
  };

  const generateGrid = (numOfRows, numOfColumns) => {
    return Array(numOfRows)
      .fill(null)
      .map(() => Array(numOfColumns).fill(false));
  };

  const grid = generateGrid(cellsVertical, cellsHorizontal);

  const horizontals = generateGrid(cellsVertical - 1, cellsHorizontal);

  const verticals = generateGrid(cellsVertical, cellsHorizontal - 1);

  const stepThroughCell = (row, column) => {
    // if I have visited this cell we would return nothing
    if (grid[row][column]) {
      return;
    }
    //if not visted mark this cell as visited
    grid[row][column] = true;
    //assemble find a neighbors of this cell(top,left,right,bottom) from this cell using little manipulation
    const neighbors = shuffle([
      [row - 1, column, "up"],
      [row, column + 1, "right"],
      [row + 1, column, "down"],
      [row, column - 1, "left"],
    ]);
    //loop over the neighbors array to see any neighbor is out of bound
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      //see if neighbor is out of bounds continue
      //if we have visited that neighbor continue
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal ||
        grid[nextRow][nextColumn]
      ) {
        continue;
      }

      //remove a wall from horizontalss or verticalss
      switch (direction) {
        case "left":
          verticals[row][column - 1] = true;
          break;
        case "right":
          verticals[row][column] = true;
          break;
        case "up":
          horizontals[row - 1][column] = true;
          break;
        case "down":
          horizontals[row][column] = true;
          break;
      }
      stepThroughCell(nextRow, nextColumn);
    }
  };

  //choose a random a starting row and column

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  stepThroughCell(startRow, startColumn);

  //draw horizontal wall for maze
  //formula
  horizontals.forEach((row, rowIndex) => {
    row.forEach((isOpen, columnIndex) => {
      //if wall is open we dont draw a wall
      if (isOpen) {
        return;
      }
      //find a dynamic length of xaxis and yaxis unit in canvas
      const wall = Bodies.rectangle(
        //our rectangle middle should be placed on middle of columnindex of the horizontals array
        //ex: we want to draw a horizontal wall for 0th index that would be 0th column=0*unitlength(for ex we'd assume 200)+unitlength/2(100)
        //we need to place our wall middle of the unitlength for the 0th index
        columnIndex * unitLengthX + unitLengthX / 2,
        //rectangle can be placed on rowindex
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        5,
        {
          isStatic: true,
          label: "wall",
          render: {
            fillStyle: "#DA0C81",
          },
        }
      );
      World.add(world, wall);
    });
  });

  //draw vertical wall for maze

  verticals.forEach((row, rowIndex) => {
    row.forEach((isOpen, columnIndex) => {
      if (isOpen) {
        return;
      }
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        {
          isStatic: true,
          label: "wall",
          render: {
            fillStyle: "#DA0C81",
          },
        }
      );
      World.add(world, wall);
    });
  });

  //draw a goal object that is the destiny of the game(finishing point of the game)

  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      isStatic: true,
      label: "goal",
      render: {
        fillStyle: "#639CD9",
      },
    }
  );
  World.add(world, goal);

  //ball object that user can move through maze

  const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    Math.min(unitLengthX, unitLengthY) / 4,
    {
      label: "ball",
      render: {
        fillStyle: "#8B9A46",
      },
    }
  );

  World.add(world, ball);

  //listener for key events for movement
  document.addEventListener("keydown", (event) => {
    const { x, y } = ball.velocity;
    const speedLimit = 10;
    if (event.code === "KeyW" || event.code === "ArrowUp") {
      Body.setVelocity(ball, { x, y: Math.max(y - 5, -speedLimit) });
    }
    if (event.code === "KeyD" || event.code === "ArrowRight") {
      Body.setVelocity(ball, { x: Math.min(x + 5, speedLimit), y });
    }
    if (event.code === "KeyS" || event.code === "ArrowDown") {
      Body.setVelocity(ball, { x, y: Math.min(y + 5, speedLimit) });
    }
    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      Body.setVelocity(ball, { x: Math.max(x - 5, -speedLimit), y });
    }
  });

  //win conditions

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const labels = ["ball", "goal"];
      if (
        labels.includes(pair.bodyA.label) &&
        labels.includes(pair.bodyB.label)
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

  //refresh button
  document.querySelector(".winner .btn").addEventListener("click", (event) => {
    //clean the engine
    event.preventDefault();
    World.clear(world);
    Engine.clear(engine);
    Render.stop(render);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
    document.querySelector(".winner").classList.add("hidden");
    generateMazeGame();
  });
};

generateMazeGame();
