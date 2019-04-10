/*es6*/
/* Add animated markers to an SVG file.
    svgSelector: selector for an <object> tag that links to an external SVG
    paths: a list of paths and animation options (and what markers to use)

    For an example of a path object, see overlayPath.
*/


function animateSVG(svgSelector, paths) {
  // Make an SVG container
  const svgObject = document.querySelector(svgSelector);
  if (svgObject == null) {
    console.log(`SVG element not found: ${svgSelector}`)
    return;
  }

  // We need to wait for the linked SVG inside the object to load
  svgObject.addEventListener('load', () => {
      const svg = d3.select(svgObject.contentDocument).select("svg");
      paths.forEach((path) => overlayPath(svg, path));
  });
}

/* Overlay a path on an SVG element with an animated marker.
    svg: the parent SVG element for D3, where we draw the markers
    svgChild: the child SVG element, which we're animating
    path: an object with some options for the path we're animating

    Example path object:
    {
      pathSelector: document selector for the SVG path we're animation
      marker: options for the animated markers that move along the path
              (see addMarker for some example marker options)
    }
*/
function overlayPath(svg, pathOptions) {
  // The path we're tracking
  const path = svg.select(pathOptions.pathSelector).node();

  // Start a loop that adds a marker at random intervals
  (function loop() {
    let rand = Math.round(Math.random() * 300) + 200
    setTimeout(() =>  {
      addMarker(pathOptions.marker);
      loop();
    }, rand);
  })();

  /* Add a marker, animate it along the path, then remove it.
      markerOptions: an object with settings for the marker.

      Example options:
        {
          style: any CSS styles for the marker
          shape: SVG shape for the marker
          size: the marker size
        }
  */
  function addMarker(markerOptions) {
    // Get the coordinates for the starting point of the path we're animating
    const p = transformPoint(path.getPointAtLength(0), path);

    const marker = svg.append(markerOptions.shape)
        .attrs({
          "r": markerOptions.size,
          "style": markerOptions.style,
          "transform": `translate(${p.x},${p.y})`
        });

    marker.transition()
          .duration(3000)
          .ease(d3.easeLinear)
          .attrTween("transform", translateAlong(path))
          .on("end", () => marker.remove());
  }

  // Tweening function to translate along an SVG path
  function translateAlong(path) {
    const length = path.getTotalLength();

    return (d, i, a) => (t) => {
      // Return the coordinate located at a certain distance along the path
      //   --> make sure that the point is transformed into the container's
      //       SVG space first
      const p = transformPoint(path.getPointAtLength(t*length), path);
      return `translate(${p.x},${p.y})`;
    }
  }

  // Translates a point to match the path's translation
  function transformPoint(svgPoint) {
    const consolidated = path.transform.baseVal.consolidate()

    if (consolidated) {
      svgPoint.x += consolidated.matrix.e;
      svgPoint.y += consolidated.matrix.f;
    }

    return svgPoint;
  }
}
