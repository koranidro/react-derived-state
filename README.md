# @koranidro/react-derived-state

## 1. 설치

```bash
npm install @koranidro/react-derived-state
```

## 2. 용도 및 사용법

### 2-1. useDerivedState

파생 상태를 보존 운용하기 위한 React 훅입니다. 일반적으로 파생 상태를 사용할 때는 보존이 필요하지 않지만, 객체의 참조 유지 등의 이유로 필요한 경우가 있습니다.

기본적으로 useMemo와 매우 흡사합니다. 하지만 아래와 같은 주요 차이점이 있습니다.

1. 생성 함수의 인수로 의존성을 전달합니다. 이는 함수가 컴포넌트 외부에 선언될 수 있음을 의미합니다.
2. 상태의 보존을 의미론적으로 보장합니다. 즉, 의존성 변경 또는 마운트 해제 외의 어떠한 경우에도 상태를 폐기하지 않습니다. 이는 useMemo가 성능 향상이 목적인 것에 반해 보존 자체가 목적이기 때문입니다.
3. 마운트 후에는 동시성 렌더링 환경에서 안전합니다. 즉, 마운트 후에는 커밋되지 않은 렌더링 상황에서도 상태를 보존합니다.

사용법은 아래와 같습니다.

```typescript
import { useState } from "react";
import { useDerivedState } from "@koranidro/react-derived-state";

function factory(n: number): number {
    return n * 3;
}

function Component() {
    const [ state, setState ] = useState(5);
    const derivedState = useDerivedState(factory, [ state ]);
    
    return (
        <div>
            <div>상태 값 = {state}</div>
            <div>파생 상태 값 = {derivedState}</div>
            <div><button onClick={() => setState(prev => prev + 1)}>증가!</button></div>
        </div>
    );
}
```

### 2-2. Fulfilled

React 환경에서 Promise를 쉽게 운용하기 위한 컴포넌트입니다.

Promise의 상태에 따라 아래과 같은 동작을 수행합니다.

- 대기(pending): 가장 가까운 부모 Suspense에 알립니다.
- 이행(fulfilled): Promise의 이행 결과를 반환합니다.
- 반려(rejected): 반려된 Promise의 오류를 던집니다.

처음 전달된 Promise는 반드시 대기 상태로 평가됩니다. 따라서 렌더링 간 참조를 유지할 필요가 있습니다.

사용법은 아래와 같습니다.

```typescript
import { Suspense } from "react";
import { useDerivedState, Fulfilled } from "@koranidro/react-derived-state";

function factory() {
    return new Promise<number>(resolve => setTimeout(() => resolve(5), 5000));
}

function Component() {
    const state = useDerivedState(factory, []);
    
    return (
        <Suspense fallback="로드 중...">
            <Fulfilled promise={state}/>
        </Suspense>
    );
}
```

### 2-3. useDerivedStateWithSideEffect

아래에 모두 해당하는 경우, 이 훅의 사용을 고려해볼 수 있습니다.

1. 상태 생성과 부작용을 분리하고 싶습니다. 또 부작용은 적절히 정리할 수 있길 원합니다.
2. 초기에 undefined나 null을 반환하고 싶지 않습니다. 이는 새로운 상태의 파생을 방해하기 때문입니다.

이 훅은 아래와 같은 요소를 보장합니다.

1. 마운트 후에는 동시성 렌더링 환경에서 안전합니다. 부작용은 커밋 후에만 수행되기 때문입니다.
2. 화면에 표시(페인팅)되기 전에 생성과 부작용이 모두 수행됩니다.

이 훅은 객체의 참조 자체에 의미가 있거나 필수 기능이 비동기적으로 수행되는 경우 유용할 수 있습니다.

사용법은 아래와 같습니다.

```typescript
import { useState } from "react";
import { useDerivedState, useDerivedStateWithSideEffect } from "@koranidro/react-derived-state";

interface NumberGenerator {
    put(n: number): void;
    setCallback(callback: (n: number) => void): void;
}

interface NumberSource {
    get(): number;
}

function factory(seed: number): NumberGenerator {
    let listener: (n: number) => void | undefined;

    return {
        put(n) { listener?.(Math.floor(n * seed) + 1); },
        setCallback(callback) { listener = callback; }
    };
}

function effect(generator: NumberGenerator) {
    const id = setInterval(() => generator.put(Math.random()), 1000);
    return () => clearInterval(id);
}

function Component() {
    const [ state, setState ] = useState(100);
    const generator = useDerivedStateWithSideEffect(factory, effect, [ state ]);
    const source = useDerivedState(() => {
        let value = 0;
        generator.setCallback(n => { value = n; });

        return {
            get() { return value; }
        } satisfies NumberSource;
    }, [ generator ]);

    const [ n, setN ] = useState(source.get());
    
    return (
        <div>
            <div>현재 값 = {n}</div>
            <div><button onClick={() => setN(source.get())}>현재 값 받아오기!</button></div>
        </div>
    );
}
```