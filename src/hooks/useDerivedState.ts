import { useRef } from "react";

function compareDependencies<D extends any[]>(oldDeps: D | undefined, newDeps: D) {
	return (
		oldDeps !== undefined &&
		oldDeps.length === newDeps.length &&
		!oldDeps.some((dep, i) => !Object.is(dep, newDeps[i]))
	);
}

function useComparisonWithOld<T>(
	comparer: (oldValue: T | undefined, newValue: T) => boolean,
	value: T
) {
	const ref = useRef<T | undefined>(undefined);

	const hit = comparer(ref.current, value);
	if(!hit) { ref.current = value; }

	return hit;
}

/**
 * 파생 상태를 보존 운용하기 위한 React 훅입니다. 일반적으로 파생 상태를 사용할 때는 보존이 필요하지 않지만, 객체의 참조 유지 등의 이유로 필요한 경우가 있습니다.
 * 
 * 기본적으로 `useMemo`와 매우 흡사합니다. 하지만 아래와 같은 주요 차이점이 있습니다.
 * 1. 생성 함수의 인수로 의존성을 전달합니다. 이는 함수가 컴포넌트 외부에 선언될 수 있음을 의미합니다.
 * 2. 상태의 보존을 의미론적으로 보장합니다. 즉, 의존성 변경 또는 마운트 해제 외의 어떠한 경우에도 상태를 폐기하지 않습니다. 이는 `useMemo`가 성능 향상이 목적인 것에 반해 보존 자체가 목적이기 때문입니다.
 * 3. 마운트 후에는 동시성 렌더링 환경에서 안전합니다. 즉, 마운트 후에는 커밋되지 않은 렌더링 상황에서도 상태를 보존합니다.
 * 
 * @param factory 생성 함수입니다.
 * @param deps 의존성입니다.
 * 
 * @return 생성 함수를 통해 생성된 파생 상태입니다.
 * 
 * @example
 * ```
 * import { useState } from "react";
 * import { useDerivedState } from "@koranidro/react-derived-state";
 * 
 * function factory(n: number): number {
 * 	return n * 3;
 * }
 * 
 * function Component() {
 * 	const [ state, setState ] = useState(5);
 * 	const derivedState = useDerivedState(factory, [ state ]);
 * 	
 * 	return (
 * 		<div>
 * 			<div>상태 값 = {state}</div>
 * 			<div>파생 상태 값 = {derivedState}</div>
 * 			<div><button onClick={() => setState(prev => prev + 1)}>증가!</button></div>
 * 		</div>
 * 	);
 * }
 * ```
 * 
 * [GitHub](https://github.com/koranidro/react-derived-state)
 */
function useDerivedState<D extends [] | [any, ...any[]], S>(factory: (...deps: [...D]) => S, deps: D): S;
function useDerivedState<D extends [] | [any, ...any[]], S>(factory: () => S, deps: D): S;
function useDerivedState<D extends [] | [any, ...any[]], S>(
	factory: (...deps: D) => S,
	deps: D
): S {
	const ref = useRef<S | undefined>(undefined);
	if(!useComparisonWithOld(compareDependencies, deps)) {
		ref.current = factory(...deps);
	}
	return ref.current!;
}

export default useDerivedState;