---
id: fra-react-avanzado
titulo: Patrones avanzados de GSAP en React
capa: 12-frameworks
tipo: patron
ambito: transversal
resumen: Compartir timelines entre componentes, efectos reutilizables, animaciones de salida, FLIP con listas y cierres obsoletos en callbacks de GSAP.
api: [gsap.timeline, Animation.reversed, gsap.utils.selector, Flip.getState, Flip.from]
requiere: [fra-agnostico, fra-react-usegsap]
relacionadas: [nuc-efectos, int-flip, tim-anidado, rec-transicion-flip, rec-salida]
etiquetas: [react, timeline, salida, flip, reutilizable]
fuentes:
  - resources/react-advanced.md
estado: verificado
version: 3.15.1
---
# Patrones avanzados de GSAP en React

Recetas para lo que `useGSAP` no resuelve solo: coordinar varios componentes y animar lo que React va a retirar del DOM. Suponen conocer [useGSAP](fra-react-usegsap.md). Los bloques `jsx` no se ejecutan; la lógica de GSAP que hay detrás se prueba con bloques `js`.

## Problema

React monta de abajo arriba y no sabe nada de tiempos de animación ([orden de ejecución](fra-agnostico.md)). Eso produce cuatro fricciones: un hijo se monta antes de que exista el timeline del padre, un elemento desaparece antes de animar su salida, la lista salta al quitar un elemento y los callbacks de GSAP leen estado viejo.

## Solución

### Compartir un timeline por props

Guárdalo en `useState`, no en `useRef`: el cambio de estado vuelve a renderizar y garantiza que los hijos lo reciban. Los hijos añaden su parte cuando llega. [O]

```jsx
function Pieza({ linea, indice }) {
  const el = useRef(null);

  useGSAP(() => {
    linea && linea.to(el.current, { x: 80 }, indice * 0.1);
  }, [linea, indice]);

  return <div ref={el} className="pieza" />;
}

function Conjunto() {
  const [linea, setLinea] = useState();

  const { contextSafe } = useGSAP(() => {
    setLinea(gsap.timeline());
  });

  const invertir = contextSafe(() => linea.reversed(!linea.reversed()));

  return (
    <>
      <button onClick={invertir}>Invertir</button>
      <Pieza linea={linea} indice={0} />
      <Pieza linea={linea} indice={1} />
    </>
  );
}
```

Variante con callback: el padre pasa `añadir(animacion, indice)` memorizado con `useCallback`, y el hijo le entrega su tween. Es útil si los hijos no deben conocer el timeline. Como los dos se ejecutan a la vez, el hijo debe tener esa función en `dependencies`. [O]

La lógica de fondo no depende de React: ver [partes que aportan a un timeline común](../03-timeline/tim-anidado.md). [E]

### Comunicar sin pasar props

Para árboles profundos usa el Context de React, que no tiene nada que ver con `gsap.context()`: un proveedor expone el estado y cada componente anima en un `useGSAP` con ese valor en sus dependencias. [O]

```jsx
const Seleccion = createContext();

function Opcion({ id }) {
  const el = useRef(null);
  const { activa } = useContext(Seleccion);

  useGSAP(() => {
    gsap.to(el.current, { x: activa === id ? 100 : 0 });
  }, [activa, id]);

  return <div ref={el}>{id}</div>;
}
```

### Componente declarativo reutilizable

Encapsula la animación y expón la instancia por `ref`. Desde React 19 `ref` llega como prop normal. [O]

```jsx
function Aparecer({ children, stagger = 0, x = 0, ref }) {
  const el = useRef(null);
  const animacion = useRef(null);

  useGSAP(() => {
    animacion.current = gsap.from(el.current.children, { opacity: 0, stagger, x });
  });

  useGSAP(() => {
    if (typeof ref === "function") ref(animacion.current);
    else if (ref) ref.current = animacion.current;
  }, [ref]);

  return <span ref={el}>{children}</span>;
}
```

Si el hijo es un Fragment o un componente función sin nodo propio, `el.current.children` no sirve: pasa un ref al objetivo. [O]

### Efectos registrados

`gsap.registerEffect()` en el ámbito del módulo, y un componente fino que los invoca. Ver [efectos](../02-nucleo/nuc-efectos.md). [O]

### Animación de salida

Aplaza el cambio de estado hasta `onComplete`: el nodo sigue en el DOM mientras anima. El patrón general, con corte a mitad de salida, está en [rec-salida](../14-recetas/rec-salida.md). [O]

```jsx
function Aviso() {
  const raiz = useRef(null);
  const [visible, setVisible] = useState(true);
  const { contextSafe } = useGSAP({ scope: raiz });

  const cerrar = contextSafe(() => {
    gsap.to(".aviso", { autoAlpha: 0, y: -10, onComplete: () => setVisible(false) });
  });

  return (
    <div ref={raiz}>
      {visible && <div className="aviso"><button onClick={cerrar}>Cerrar</button></div>}
    </div>
  );
}
```

En listas, identifica cada elemento por `key` estable y pasa el nodo con `e.currentTarget`. [O]

### Lista sin saltos con Flip

Al quitar un elemento, los demás saltan. Con Flip se captura el estado **antes** de cambiar el DOM y se anima **después** de que React lo actualice. [O]

```jsx
function Lista() {
  const raiz = useRef(null);
  const q = gsap.utils.selector(raiz);
  const [vista, setVista] = useState({ items: [1, 2, 3], estado: null });

  useGSAP(() => {
    if (!vista.estado) return;
    Flip.from(vista.estado, {
      targets: q(".fila"),
      absolute: true,
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0 }),
    });
  }, { dependencies: [vista], scope: raiz });

  const quitar = (id) =>
    setVista({ estado: Flip.getState(q(".fila")), items: vista.items.filter((n) => n !== id) });

  return (
    <div ref={raiz}>
      {vista.items.map((n) => (
        <button key={n} className="fila" onClick={() => quitar(n)}>{n}</button>
      ))}
    </div>
  );
}
```

Este ejemplo saca el nodo del DOM en el mismo render, así que `onLeave` no actúa sobre él. Para que anime la salida, márcalo con una clase `display: none`, deja que Flip lo trate como saliente y quítalo del estado en `timeline.add(() => …)`, como hace la guía oficial. [O]

### Cierres obsoletos

Un callback de tween se crea una vez y conserva el estado de ese render. `useStateRef`, o un ref actualizado a mano, le da acceso al valor vigente. [O]

```jsx
function useEstadoRef(inicial) {
  const [estado, setEstado] = useState(inicial);
  const ref = useRef(estado);
  const fijar = useCallback((valor) => {
    ref.current = typeof valor === "function" ? valor(ref.current) : valor;
    setEstado(ref.current);
  }, []);
  return [estado, fijar, ref];
}
```

## Trampas

- **`useState` para el timeline implica un render extra.** Es el precio de que los hijos lo reciban: `setLinea` dentro del hook provoca una segunda pasada, con las dependencias de los hijos cambiando de `undefined` al timeline. [P]
- **La guía oficial trae fragmentos incoherentes.** En "callback" llama a `tl.current.reversed()` sobre un timeline guardado en estado, y en "salida" usa `ctx.remove`, `boxRef` y `container` sin definir. Las demos enlazadas son las correctas: no copies esos fragmentos. [C]
- **`setState` en `onComplete` tras desmontar.** El contexto revierte el tween al desmontar, y un tween revertido no llega a `onComplete` por sí mismo. Si el callback es otro temporizador tuyo, compruébalo tú. [P]
- **`gsap.utils.selector(raiz)` en el cuerpo** crea una función nueva en cada render; si la pones en `dependencies` el efecto corre siempre. Memorízala o déjala fuera. [P]
- **Efectos en el módulo, no en el componente.** Registrarlos en cada render sobrescribe el mismo nombre sin ganancia. [P]
