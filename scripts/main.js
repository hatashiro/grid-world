const $controlForm = document.querySelector('#controlForm');
const $world = document.querySelector('#world');

$controlForm.addEventListener('submit', (evt) => {
  // No page reload.
  evt.preventDefault();

  updateWorld(createOptions());
});

const METHODS = {
  VALUE_ITERATION: 'ValueIteration',
  Q_LEARNING: 'QLearning',
};

function createOptions() {
  return {
    positiveGoalValue: Number($controlForm.positiveGoalValue.value),
    negativeGoalValue: Number($controlForm.negativeGoalValue.value),
    discountFactor: Number($controlForm.discountFactor.value),
    movementCost: Number($controlForm.movementCost.value),
    movementNoiseProbability: Number($controlForm.movementNoiseProbability.value),
    learningRate: Number($controlForm.learningRate.value),
    explorationRate: Number($controlForm.explorationRate.value),
    numEpisodes: Number($controlForm.numEpisodes.value),
    method: $controlForm.method.value,
  };
}

const actions = ['up', 'right', 'down', 'left'];

function createCell() {
  const $cell = document.createElement('div');
  $cell.classList.add('cell');

  const actionLabels = {up: '↑', right: '→', down: '↓', left: '←'};

  actions.forEach((action) => {
    const $action = document.createElement('div');
    $action.classList.add('action');
    $action.classList.add(action);

    const $label = document.createElement('div');
    $label.classList.add('label');
    $label.textContent = actionLabels[action];
    $action.appendChild($label);

    const $score = document.createElement('div');
    $score.classList.add('score');
    $score.textContent = '0.0';
    $action.appendChild($score);

    $cell.appendChild($action);
  });

  const $value = document.createElement('div');
  $value.classList.add('value');
  $value.textContent = '0.0';
  $cell.appendChild($value);

  return $cell;
}

function setValue($cell, value) {
  $cell.querySelector('.value').textContent = value;
}

function setScores($cell, scores) {
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const score = scores[i];

    const $score = $cell.querySelector(`.action.${action} .score`);
    $score.textContent = Number(score).toFixed(2);

    const scale = 1 + (score - min) / (max - min);
    if (scale) {
      const $label = $cell.querySelector(`.action.${action} .label`);
      $label.style.transform = `scale(${scale})`;
    }
  }
}

const numRows = 3;
const numCols = 4;

function updateWorld(opts) {
  // Empty the world.
  $world.innerHTML = '';

  const $cells = []
  const Q = []
  for (let row = 0; row < numRows; row++) {
    $cells.push([]);
    Q.push([]);

    for (let col = 0; col < numCols; col++) {
      const $cell = createCell();
      $world.appendChild($cell);
      $cells[row].push($cell);
      Q[row].push([0, 0, 0, 0]);
    }
  }

  // Wall
  $cells[1][1].classList.add('wall');
  Q[1][1] = null;

  // Start
  $cells[2][0].classList.add('start');
  setValue($cells[2][0], 'Start');

  // Goals
  $cells[0][3].classList.add('goal');
  $cells[0][3].classList.add('positive');
  Q[0][3] = opts.positiveGoalValue;
  setValue($cells[0][3], opts.positiveGoalValue);
  $cells[1][3].classList.add('goal');
  $cells[1][3].classList.add('negative');
  setValue($cells[1][3], opts.negativeGoalValue);
  Q[1][3] = opts.negativeGoalValue;

  switch (opts.method) {
    case METHODS.VALUE_ITERATION:
      valueIteration(Q, opts);
      break;
    case METHODS.Q_LEARNING:
      qLearning(Q, opts);
      break;
  }

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if (Q[row][col] instanceof Array) {
        setScores($cells[row][col], Q[row][col]);
      }
    }
  }
}

function nextQ(Q, row, col, a) {
  let nextRow = row;
  let nextCol = col;

  switch (a) {
    case 0:  // Up
      nextRow -= 1;
      break
    case 1:  // Right
      nextCol += 1;
      break
    case 2:  // Down
      nextRow += 1;
      break
    case 3:  // Left
      nextCol -= 1;
      break
  }

  if (nextRow < 0 || nextRow >= numRows ||
      nextCol < 0 || nextCol >= numCols ||
      Q[nextRow][nextCol] === null /* Wall */) {
    nextRow = row;
    nextCol = col;
  }

  if (Q[nextRow][nextCol] instanceof Array) {
    return Math.max(...Q[nextRow][nextCol]);
  } else {
    return Q[nextRow][nextCol];  // Goal state.
  }
}

function valueIteration(Q, opts) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        // Skip non-states.
        if (!(Q[row][col] instanceof Array)) continue;

        for (let a = 0; a < actions.length; a++) {
          const curVal = Q[row][col][a];

          let expectedNextQ = nextQ(Q, row, col, a);

          const newVal = opts.movementCost + opts.discountFactor * expectedNextQ;
          console.log(row, col, newVal);

          if (Math.abs(curVal - newVal) > 1e-8) {
            changed = true;
          }
          Q[row][col][a] = newVal;
        }
      }
    }
  }
}

function qLearning(Q, opts) {
  // TODO
}
