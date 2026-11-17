declare module 'world-atlas/countries-110m.json' {
  import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification'

  const world: Topology & {
    objects: {
      countries: GeometryCollection<{ name?: string }>
      land: GeometryObject
    }
  }
  export default world
}
