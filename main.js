import {$} from 'https://cdn.jsdelivr.net/gh/hatashiro/web@0469a8/utility/dom.js';
import * as math from 'https://cdn.jsdelivr.net/gh/hatashiro/web@0469a8/utility/math.js';
import * as ndarray from 'https://cdn.jsdelivr.net/gh/hatashiro/web@0469a8/utility/ndarray.js';
import * as random from 'https://cdn.jsdelivr.net/gh/hatashiro/web@0469a8/utility/random.js';

const $controlForm = $('#controlForm');
const $world = $('#world');
const $result = $('#result');

$controlForm.addEventListener('submit', (evt) => {
  // No page reload.
  evt.preventDefault();

  renderWorld(createOptions());
});

function createOptions() {
  const opts = {
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

  if (opts.movementCost < 0) {
    alert('Invalid movement cost, will use 0.');
    opts.movementCost = 0;
  }

  return opts;
}

// World definitions.
const WORLD_SHAPE = [3, 4];

const START_IDX = [2, 0];
const WALL_IDX = [1, 1];
const POSITIVE_IDX = [0, 3];
const NEGATIVE_IDX = [1, 3];

function isVisitableIdx(idx) {
  return (0 <= idx[0] && idx[0] < WORLD_SHAPE[0] &&
          0 <= idx[1] && idx[1] < WORLD_SHAPE[1] &&
          // Wall is not visitable.
          !ndarray.equals(idx, WALL_IDX));
}

function isGoalIdx(idx) {
  return (ndarray.equals(idx, POSITIVE_IDX) ||
          ndarray.equals(idx, NEGATIVE_IDX));
}

function isStateIdx(idx) {
  // Goals are not states.
  return isVisitableIdx(idx) && !isGoalIdx(idx);
}

// Action definitions.

const ACTIONS = ['up', 'right', 'down', 'left'];

function nextIdx(idx, a) {
  const idx_ = ndarray.copy(idx);
  switch (a) {
    case 0:  // Up
      idx_[0] -= 1;
      break
    case 1:  // Right
      idx_[1] += 1;
      break
    case 2:  // Down
      idx_[0] += 1;
      break
    case 3:  // Left
      idx_[1] -= 1;
      break
  }
  return isVisitableIdx(idx_) ? idx_ : idx;
}

function actionProbs(a, p) {
  switch (a) {
    case 0:  // Up
      return [1 - 2 * p, p, 0, p];
    case 1:  // Right
      return [p, 1 - 2 * p, p, 0];
    case 2:  // Down
      return [0, p, 1 - 2 * p, p];
    case 3:  // Left
      return [p, 0, p, 1 - 2 * p];
  }
}

// Main logic.

function initQ(opts) {
  const shape = WORLD_SHAPE.concat([ACTIONS.length]);
  const Q = ndarray.init(shape, 0);

  ndarray.set(Q, POSITIVE_IDX, opts.positiveGoalValue);
  ndarray.set(Q, NEGATIVE_IDX, opts.negativeGoalValue);

  return Q;
}

const METHODS = {
  ValueIteration: valueIteration,
  QLearning: qLearning,
};

function renderWorld(opts) {
  // Empty the world.
  $world.innerHTML = '';

  const Q = initQ(opts);

  let result = null;
  if (opts.method) {
    result = METHODS[opts.method](Q, opts);
  }

  // Create and append cells.
  for (let row = 0; row < WORLD_SHAPE[0]; row++) {
    for (let col = 0; col < WORLD_SHAPE[1]; col++) {
      const idx = [row, col];
      $world.appendChild(createCell(ndarray.get(Q, idx), idx));
    }
  }

  // Render the result if any.
  $result.textContent = result;
}

function valueIteration(Q, opts) {
  let numIters = 0;
  let changed = true;
  while (changed) {
    numIters++;
    changed = false;
    for (let row = 0; row < WORLD_SHAPE[0]; row++) {
      for (let col = 0; col < WORLD_SHAPE[1]; col++) {
        const idx = [row, col];

        // Skip non-states.
        if (!isStateIdx(idx)) continue;

        const qs = ndarray.get(Q, idx);
        qs.forEach((q, a) => {
          const expectedQ_ = math.sum(
            actionProbs(a, opts.movementNoiseProbability).map((p, a_) =>
              p * math.max(ndarray.get(Q, nextIdx([row, col], a_))))
          );

          const R = -opts.movementCost;
          const q_ = R + opts.discountFactor * expectedQ_;

          if (Math.abs(q - q_) > 1e-8) {
            changed = true;
          }
          qs[a] = q_;
        });
      }
    }
  }

  return `Number of iterations taken to converge: ${numIters}`;
}

function qLearning(Q, opts) {
  const Rs = [];
  for (let i = 0; i < opts.numEpisodes; i++) {
    let R = 0;
    let idx = ndarray.copy(START_IDX);
    while (true) {
      const qs = ndarray.get(Q, idx);

      if (isGoalIdx(idx)) {
        R += qs[0];  // All are the same at a goal.
        break;
      }

      let a;
      if (random.choose(opts.explorationRate)) {
        a = random.choose([1/4, 1/4, 1/4, 1/4]);
      } else {
        a = math.argmax(qs);
      }

      const a_ = random.choose(actionProbs(a, opts.movementNoiseProbability));
      const idx_ = nextIdx(idx, a_);
      const Q_ = math.max(ndarray.get(Q, idx_));

      const r = -opts.movementCost;
      R += r;

      const alpha = opts.learningRate;
      const gamma = opts.discountFactor;

      qs[a] = (1 - alpha) * qs[a] + alpha * (r + gamma * Q_);

      idx = idx_;
    }
    Rs.push(R);
  }

  return `Mean reward per episode: ${math.mean(Rs)}`;
}

function createCell(qs, idx) {
  const floatStr = x => String(Number(x).toFixed(2));

  let classList = ['cell'];
  let text = '';
  if (ndarray.equals(idx, WALL_IDX)) {
    classList.push('wall');
  } else if (ndarray.equals(idx, START_IDX)) {
    classList.push('start');
    text = 'Start';
  } else if (ndarray.equals(idx, POSITIVE_IDX)) {
    classList.push('goal', 'positive');
    text = floatStr(qs[0]);
  } else if (ndarray.equals(idx, NEGATIVE_IDX)) {
    classList.push('goal', 'negative');
    text = floatStr(qs[0]);
  }

  const actionLabels = {up: '↑', right: '→', down: '↓', left: '←'};
  const scaledQ = math.rescale(qs);

  return $.div({classList}, ACTIONS.map((action, i) =>
    $.div({classList: ['action', action]}, [
      $.div({className: 'label',
             style: {transform: `scale(${(1 + scaledQ[i]) || 1})`}},
        actionLabels[action]),
      $.div({className: 'score'}, floatStr(qs[i])),
    ])
  ).concat([
    $.div({className: 'text'}, text),
  ]));
}


// Initially render the world with no learning.
renderWorld({...createOptions(), method: null});
