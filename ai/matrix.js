
export const Matrix = {
  dot_product: (a, b) => {
    let result = new Array(a.length).fill(0).map(
      row => new Array(b[0].length
    ).fill(0));

    return result.map(
      (row, i) => row.map(
        (val, j) => a[i].reduce(
          (sum, elm, k) => sum + (elm * b[k][j]), 0,
        ),
      ),
    );
  },
  add: (a, b) => {
    let result = [];
    for (let i = 0; i < a.length; i++) {
      result.push([]);
      for (let j = 0; j < a[i].length; j++) {
        result[i].push(a[i][j] + b[i]);
      }
    }
    return result;
  },
  activation: (x) => {
    let result = [];
    for (let i = 0; i < x.length; i++) {
      result.push([1/(1+(Math.exp(-x[i])))]);
    }
    return result;
  },
};
