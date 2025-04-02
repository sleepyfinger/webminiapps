class SortingVisualizer {
  constructor() {
    this.array = [];
    this.isSorting = false;
    this.speed = 100;
    this.initControls();
    this.generateNewArray(50);
  }

  initControls() {
    document
      .getElementById("start-btn")
      .addEventListener("click", () => this.toggleSort());
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.reset());
    document.getElementById("speed").addEventListener("input", (e) => {
      this.speed = 500 - e.target.value;
    });
  }

  async toggleSort() {
    if (this.isSorting) return;
    this.isSorting = true;

    const algorithm = document.getElementById("algorithm-select").value;
    switch (algorithm) {
      case "bubble":
        await this.bubbleSort();
        break;
      case "selection":
        await this.selectionSort();
        break;
      case "insertion":
        await this.insertionSort();
        break;
      case "merge":
        await this.mergeSort();
        break;
      case "quick":
        await this.quickSort();
        break;
      case "heap":
        await this.heapSort();
        break;
      case "radix":
        await this.radixSort();
        break;
      case "shell":
        await this.shellSort();
        break;
    }

    this.isSorting = false;
  }

  async pause() {
    await new Promise((resolve) => setTimeout(resolve, this.speed));
  }

  generateNewArray(length = 50) {
    this.array = Array.from(
      { length },
      () => Math.floor(Math.random() * 90) + 10
    );
    this.renderArray();
  }

  renderArray() {
    const container = document.getElementById("array-container");
    container.innerHTML = "";

    this.array.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${value}%`;
      container.appendChild(bar);
    });
  }

  async bubbleSort() {
    for (let i = 0; i < this.array.length; i++) {
      for (let j = 0; j < this.array.length - i - 1; j++) {
        this.highlightBars([j, j + 1], "comparing");
        await this.pause();

        if (this.array[j] > this.array[j + 1]) {
          [this.array[j], this.array[j + 1]] = [
            this.array[j + 1],
            this.array[j],
          ];
          this.highlightBars([j, j + 1], "swapping");
          this.renderArray();
          await this.pause();
        }

        this.resetBarColors();
      }
      this.markSorted(this.array.length - i - 1);
    }
    this.markAllSorted();
  }

  async selectionSort() {
    for (let i = 0; i < this.array.length - 1; i++) {
      let minIndex = i;
      for (let j = i + 1; j < this.array.length; j++) {
        this.highlightBars([j, minIndex], "comparing");
        await this.pause();
        if (this.array[j] < this.array[minIndex]) {
          minIndex = j;
        }
        this.resetBarColors();
      }
      if (minIndex !== i) {
        [this.array[i], this.array[minIndex]] = [
          this.array[minIndex],
          this.array[i],
        ];
        this.highlightBars([i, minIndex], "swapping");
        this.renderArray();
        await this.pause();
      }
      this.markSorted(i);
    }
    this.markAllSorted();
  }

  async insertionSort() {
    for (let i = 1; i < this.array.length; i++) {
      let key = this.array[i];
      let j = i - 1;
      this.highlightBars([i], "comparing");
      await this.pause();

      while (j >= 0 && this.array[j] > key) {
        this.highlightBars([j, j + 1], "swapping");
        this.array[j + 1] = this.array[j];
        this.renderArray();
        await this.pause();
        j--;
      }
      this.array[j + 1] = key;
      this.renderArray();
      this.resetBarColors();
      this.markSorted(i);
    }
    this.markAllSorted();
  }

  async mergeSort() {
    await this.mergeSortHelper(0, this.array.length - 1);
    this.markAllSorted();
  }

  async mergeSortHelper(low, high) {
    if (low < high) {
      const mid = Math.floor((low + high) / 2);
      await this.mergeSortHelper(low, mid);
      await this.mergeSortHelper(mid + 1, high);
      await this.merge(low, mid, high);
    }
  }

  async merge(low, mid, high) {
    const left = this.array.slice(low, mid + 1);
    const right = this.array.slice(mid + 1, high + 1);
    let i = 0,
      j = 0,
      k = low;

    while (i < left.length && j < right.length) {
      this.highlightBars([low + i, mid + 1 + j], "comparing");
      await this.pause();
      if (left[i] <= right[j]) {
        this.array[k] = left[i];
        i++;
      } else {
        this.array[k] = right[j];
        j++;
      }
      this.highlightBars([k], "swapping");
      this.renderArray();
      await this.pause();
      k++;
      this.resetBarColors();
    }

    while (i < left.length) {
      this.array[k] = left[i];
      this.highlightBars([k], "swapping");
      this.renderArray();
      await this.pause();
      i++;
      k++;
      this.resetBarColors();
    }

    while (j < right.length) {
      this.array[k] = right[j];
      this.highlightBars([k], "swapping");
      this.renderArray();
      await this.pause();
      j++;
      k++;
      this.resetBarColors();
    }
    for (let l = low; l <= high; l++) {
      this.markSorted(l);
    }
  }

  async quickSort() {
    const stack = [{ low: 0, high: this.array.length - 1 }];

    while (stack.length) {
      const { low, high } = stack.pop();
      if (low >= high) continue;

      const pivot = await this.partition(low, high);
      stack.push({ low, high: pivot - 1 });
      stack.push({ low: pivot + 1, high });
    }
    this.markAllSorted();
  }

  async partition(low, high) {
    const pivot = this.array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.highlightBars([j], "comparing");
      await this.pause();

      if (this.array[j] < pivot) {
        i++;
        [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
        this.highlightBars([i, j], "swapping");
        this.renderArray();
        await this.pause();
      }
      this.resetBarColors();
    }

    [this.array[i + 1], this.array[high]] = [
      this.array[high],
      this.array[i + 1],
    ];
    this.highlightBars([i + 1, high], "swapping");
    this.renderArray();
    this.resetBarColors();
    return i + 1;
  }

  async heapSort() {
    const n = this.array.length;

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      await this.heapify(n, i);
    }

    for (let i = n - 1; i > 0; i--) {
      [this.array[0], this.array[i]] = [this.array[i], this.array[0]];
      this.highlightBars([0, i], "swapping");
      this.renderArray();
      await this.pause();
      this.resetBarColors();
      await this.heapify(i, 0);
      this.markSorted(i);
    }
    this.markAllSorted();
  }

  async heapify(n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n) {
      this.highlightBars([largest, left], "comparing");
      await this.pause();
      if (this.array[left] > this.array[largest]) {
        largest = left;
      }
      this.resetBarColors();
    }

    if (right < n) {
      this.highlightBars([largest, right], "comparing");
      await this.pause();
      if (this.array[right] > this.array[largest]) {
        largest = right;
      }
      this.resetBarColors();
    }

    if (largest !== i) {
      [this.array[i], this.array[largest]] = [
        this.array[largest],
        this.array[i],
      ];
      this.highlightBars([i, largest], "swapping");
      this.renderArray();
      await this.pause();
      this.resetBarColors();
      await this.heapify(n, largest);
    }
  }

  async radixSort() {
    const max = Math.max(...this.array);
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      await this.countingSort(exp);
    }
    this.markAllSorted();
  }

  async countingSort(exp) {
    const n = this.array.length;
    const output = new Array(n).fill(0);
    const count = new Array(10).fill(0);

    for (let i = 0; i < n; i++) {
      const index = Math.floor(this.array[i] / exp) % 10;
      count[index]++;
    }

    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }

    for (let i = n - 1; i >= 0; i--) {
      const index = Math.floor(this.array[i] / exp) % 10;
      output[count[index] - 1] = this.array[i];
      count[index]--;
    }

    for (let i = 0; i < n; i++) {
      this.array[i] = output[i];
      this.highlightBars([i], "swapping");
      this.renderArray();
      await this.pause();
      this.resetBarColors();
    }
  }

  async shellSort() {
    const n = this.array.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        const temp = this.array[i];
        let j;
        for (j = i; j >= gap && this.array[j - gap] > temp; j -= gap) {
          this.highlightBars([j, j - gap], "swapping");
          this.array[j] = this.array[j - gap];
          this.renderArray();
          await this.pause();
          this.resetBarColors();
        }
        this.array[j] = temp;
      }
    }
    this.markAllSorted();
  }

  highlightBars(indices, state) {
    indices.forEach((index) => {
      const bar = document.getElementById("array-container").children[index];
      bar.style.backgroundColor = `var(--${state}-color)`;
    });
  }

  resetBarColors() {
    document.querySelectorAll(".bar").forEach((bar) => {
      bar.style.backgroundColor = "var(--default-color)";
    });
  }

  markSorted(index) {
    document.getElementById("array-container").children[
      index
    ].style.backgroundColor = "var(--sorted-color)";
  }

  markAllSorted() {
    document.querySelectorAll(".bar").forEach((bar) => {
      bar.style.backgroundColor = "var(--sorted-color)";
    });
  }

  reset() {
    this.isSorting = false;
    this.generateNewArray(50);
    this.resetBarColors();
  }
}

const visualizer = new SortingVisualizer();
