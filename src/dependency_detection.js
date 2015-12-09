let stack = [];
let frame = null;

export function track(property) {
    if (frame !== null) {
        frame.add(property);
    }
}

export function evaluate(evaluator) {
    stack.push(frame);
    let dependencies = new Set();
    frame = dependencies;
    let value = evaluator();
    frame = stack.pop();
    return {value, dependencies};
}
