const $controlForm = document.querySelector('#controlForm');

$controlForm.addEventListener('submit', (evt) => {
  updateWorld(createOptions());

  // No page reload.
  evt.preventDefault();
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
    method: $controlForm.method.value,
  };
}

function updateWorld(opts) {
  // TODO
  console.log(opts)
}
