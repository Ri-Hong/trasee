interface ListVisualizerProps {
  data: {
    items: Array<{ index: number; value: any }>;
  };
  variableName: string;
  dataType: string;
}

function is2DMatrix(items: Array<{ index: number; value: any }>): boolean {
  if (items.length === 0) return false;

  // Check if all items are arrays
  const allArrays = items.every((item) => Array.isArray(item.value));
  if (!allArrays) return false;

  // Check if all arrays have the same length
  const firstLength = items[0].value.length;
  return items.every(
    (item) => item.value.length === firstLength && firstLength > 0
  );
}

export function ListVisualizer({
  data,
  variableName,
  dataType,
}: ListVisualizerProps) {
  if (!data.items || data.items.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {variableName}
          </div>
          <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
            {dataType}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">Empty list</div>
      </div>
    );
  }

  // Check if it's a 2D matrix
  if (is2DMatrix(data.items)) {
    const matrix = data.items.map((item) => item.value as any[]);
    const rows = matrix.length;
    const cols = matrix[0].length;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-muted-foreground">
            {variableName} ({rows} × {cols})
          </div>
          <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
            {dataType}
          </span>
        </div>
        <div className="inline-block">
          <div className="flex">
            {/* Top-left corner spacer */}
            <div className="w-10" />

            {/* Column indices */}
            <div className="flex gap-0">
              {Array.from({ length: cols }, (_, colIdx) => (
                <div
                  key={`col-${colIdx}`}
                  className="flex items-center justify-center px-4 py-1 min-w-[60px]"
                >
                  <div className="text-xs text-muted-foreground font-mono">
                    {colIdx}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix rows with row indices */}
          {matrix.map((row, rowIdx) => (
            <div key={`row-${rowIdx}`} className="flex">
              {/* Row index */}
              <div className="flex items-center justify-center w-10 py-3">
                <div className="text-xs text-muted-foreground font-mono">
                  {rowIdx}
                </div>
              </div>

              {/* Row cells */}
              <div className="flex gap-0">
                {row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="flex items-center justify-center border border-green-500/30 bg-green-500/5 px-4 py-3 min-w-[60px]"
                  >
                    <div className="text-sm font-mono font-semibold">
                      {String(cell)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Regular 1D list
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-muted-foreground">
          {variableName}
        </div>
        <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
          {dataType}
        </span>
      </div>
      <div className="inline-block">
        {/* Indices */}
        <div className="flex gap-0">
          {data.items.map((item) => (
            <div
              key={`idx-${item.index}`}
              className="flex items-center justify-center px-4 py-1 min-w-[60px]"
            >
              <div className="text-xs text-muted-foreground font-mono">
                {item.index}
              </div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="flex gap-0">
          {data.items.map((item) => (
            <div
              key={item.index}
              className="flex items-center justify-center border border-green-500/30 bg-green-500/5 px-4 py-3 min-w-[60px]"
            >
              <div className="text-sm font-mono font-semibold">
                {String(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
