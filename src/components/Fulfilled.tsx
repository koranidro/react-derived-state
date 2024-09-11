enum PromiseState { PENDING, FULFILLED, REJECTED };

interface PromiseStatus<T> {
	waiting: Promise<void>;
	state: PromiseState;
	value?: T;
	error?: any;
}

interface PromiseTracker {
	wasFulfilled(promise: Promise<any>): boolean;
	wasRejected(promise: Promise<any>): boolean;
	getWaiting(promise: Promise<any>): Promise<void>;
	getValue<T>(promise: Promise<T>): T;
	getError(promise: Promise<any>): any;
}

class DefaultPromiseTracker implements PromiseTracker {
	private map = new WeakMap<Promise<any>, PromiseStatus<any>>();

	private register(promise: Promise<any>): void {
		const status: PromiseStatus<any> = {
			waiting: promise
				.then(value => { status.state = PromiseState.FULFILLED; status.value = value; })
				.catch(error => { status.state = PromiseState.REJECTED; status.error = error; }),
			state: PromiseState.PENDING
		};
		this.map.set(promise, status);
	}

	private registerIfNotYet(promise: Promise<any>): void {
		if(this.map.has(promise)) { return; }
		this.register(promise);
	}

	private getState(promise: Promise<any>): PromiseState {
		return this.map.get(promise)!.state;
	}

	wasFulfilled(promise: Promise<any>): boolean {
		this.registerIfNotYet(promise);
		return this.getState(promise) === PromiseState.FULFILLED;
	}

	wasRejected(promise: Promise<any>): boolean {
		this.registerIfNotYet(promise);
		return this.getState(promise) === PromiseState.REJECTED;
	}

	getWaiting(promise: Promise<any>): Promise<void> {
		this.registerIfNotYet(promise);
		return this.map.get(promise)!.waiting;
	}

	getValue<T>(promise: Promise<T>): T {
		this.registerIfNotYet(promise);
		return this.map.get(promise)!.value;
	}

	getError(promise: Promise<any>) {
		this.registerIfNotYet(promise);
		return this.map.get(promise)!.error;
	}
	
}

const use = (function () {
	const tracker = new DefaultPromiseTracker();

	return function <T>(promise: Promise<T>): T {
		if(tracker.wasFulfilled(promise)) { return tracker.getValue(promise); }
		throw tracker.wasRejected(promise) ?
			tracker.getError(promise) :
			tracker.getWaiting(promise);
	};
})();

/**
 * {@link Fulfilled | `Fulfilled`}의 속성입니다.
 *
 * [GitHub](https://github.com/koranidro/react-derived-state)
 */
interface FulfilledProps<T> {
	promise: Promise<T>;
}

/**
 * React 환경에서 `Promise`를 쉽게 운용하기 위한 컴포넌트입니다.
 * 
 * `Promise`의 상태에 따라 아래과 같은 동작을 수행합니다.
 * - 대기(pending): 가장 가까운 부모 `Suspense`에 알립니다.
 * - 이행(fulfilled): `Promise`의 이행 결과를 반환합니다.
 * - 반려(rejected): 반려된 `Promise`의 오류를 던집니다.
 * 
 * 처음 전달된 `Promise`는 반드시 대기 상태로 평가됩니다. 따라서 렌더링 간 참조를 유지할 필요가 있습니다.
 * 
 * @param props 컴포넌트의 {@link FulfilledProps | 속성}입니다.
 * 
 * @return `Promise`의 이행 결과입니다.
 * 
 * @throws
 * - `Promise<void>`: `Promise`가 대기 중일 때 던집니다.
 * - `any`: `Promise`가 반려되었을 때 던집니다.
 * 
 * @example
 * ```
 * import { Suspense } from "react";
 * import { useDerivedState, Fulfilled } from "@koranidro/react-derived-state";
 * 
 * function factory() {
 * 	return new Promise<number>(resolve => setTimeout(() => resolve(5), 5000));
 * }
 * 
 * function Component() {
 * 	const state = useDerivedState(factory, []);
 * 	
 * 	return (
 * 		<Suspense fallback="로드 중...">
 * 			<Fulfilled promise={state}/>
 * 		</Suspense>
 * 	);
 * }
 * ```
 * 
 * [GitHub](https://github.com/koranidro/react-derived-state)
 */
function Fulfilled<T>(props: FulfilledProps<T>): T {
	return use(props.promise);
}

export default Fulfilled;
export { type FulfilledProps };