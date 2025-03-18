function increaseAllCircleSizes() {
  const currentCircles = Composite.allBodies(engine.world).filter(
    (body) => body.label && body.label.startsWith("Circle-")
  );

  currentCircles.forEach((circle) => {
    const currentSizeIndex = CIRCLE_SIZES.indexOf(circle.circleRadius * 2);

    if (currentSizeIndex < MAX_CIRCLE_INDEX) {
      const newSize = CIRCLE_SIZES[currentSizeIndex + 1];

      const newCircle = createCircle(
        circle.position.x,
        circle.position.y,
        newSize
      );
      World.remove(engine.world, circle);
      World.add(engine.world, newCircle);
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "i") {
    increaseAllCircleSizes();
  }
});
