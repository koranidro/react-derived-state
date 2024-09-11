import { useLayoutEffect } from "react";

import useDerivedState from "./useDerivedState";

/**
 * 아래에 모두 해당하는 경우, 이 훅의 사용을 고려해볼 수 있습니다.
 * 1. 상태 생성과 부작용을 분리하고 싶습니다. 또 부작용은 적절히 정리할 수 있길 원합니다.
 * 2. 초기에 `undefined`나 `null`을 반환하고 싶지 않습니다. 이는 새로운 상태의 파생을 방해하기 때문입니다.
 * 
 * 이 훅은 아래와 같은 요소를 보장합니다.
 * 1. 마운트 후에는 동시성 렌더링 환경에서 안전합니다. 부작용은 커밋 후에만 수행되기 때문입니다.
 * 2. 화면에 표시(페인팅)되기 전에 생성과 부작용이 모두 수행됩니다.
 * 
 * 이 훅은 객체의 참조 자체에 의미가 있거나 필수 기능이 비동기적으로 수행되는 경우 유용할 수 있습니다.
 * 
 * @param factory 생성 함수입니다. 렌더링 중 호출되므로 여기서는 부작용을 발생시키지 않아야 합니다.
 * @param effect 상태에 대한 부작용입니다. 정리 함수를 반환해야 합니다.
 * @param deps 의존성입니다.
 * 
 * @return 파생 상태입니다.
 * 
 * @example
 * ```
 * import { useState } from "react";
 * import { useDerivedState, useDerivedStateWithSideEffect } from "@koranidro/react-derived-state";
 * 
 * interface NumberGenerator {
 * 	put(n: number): void;
 * 	setCallback(callback: (n: number) => void): void;
 * }
 * 
 * interface NumberSource {
 * 	get(): number;
 * }
 * 
 * function factory(seed: number): NumberGenerator {
 * 	let listener: (n: number) => void | undefined;
 * 
 * 	return {
 * 		put(n) { listener?.(Math.floor(n * seed) + 1); },
 * 		setCallback(callback) { listener = callback; }
 * 	};
 * }
 * 
 * function effect(generator: NumberGenerator) {
 * 	const id = setInterval(() => generator.put(Math.random()), 1000);
 * 	return () => clearInterval(id);
 * }
 * 
 * function Component() {
 * 	const [ state, setState ] = useState(100);
 * 	const generator = useDerivedStateWithSideEffect(factory, effect, [ state ]);
 * 	const source = useDerivedState(() => {
 * 		let value = 0;
 * 		generator.setCallback(n => { value = n; });
 * 
 * 		return {
 * 			get() { return value; }
 * 		} satisfies NumberSource;
 * 	}, [ generator ]);
 * 
 * 	const [ n, setN ] = useState(source.get());
 * 	
 * 	return (
 * 		<div>
 * 			<div>현재 값 = {n}</div>
 * 			<div><button onClick={() => setN(source.get())}>현재 값 받아오기!</button></div>
 * 		</div>
 * 	);
 * }
 * ```
 * 
 * [GitHub](https://github.com/koranidro/react-derived-state)
 */
function useDerivedStateWithSideEffect<D extends [] | [any, ...any[]], S>(
	factory: (...deps: [...D]) => S,
	effect: (state: S) => () => void,
	deps: D
): S;
function useDerivedStateWithSideEffect<D extends [] | [any, ...any[]], S>(
	factory: () => S,
	effect: (state: S) => () => void,
	deps: D
): S;
function useDerivedStateWithSideEffect<D extends [] | [any, ...any[]], S>(
	factory: (...deps: D) => S,
	effect: (state: S) => () => void,
	deps: D
): S {
	const state = useDerivedState(factory, deps);
	useLayoutEffect(() => effect(state), deps);

	return state;
}

export default useDerivedStateWithSideEffect;