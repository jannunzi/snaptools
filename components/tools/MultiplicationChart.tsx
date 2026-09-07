type MultiplicationChartProps = {
  highlightTables?: number[];
  caption?: string;
};

const RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function MultiplicationChart({
  highlightTables = [],
  caption = "Multiplication chart, 1 through 12",
}: MultiplicationChartProps) {
  return (
    <figure className="overflow-x-auto rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-medium text-ink">
        {caption}
      </figcaption>
      <table className="w-full min-w-[520px] border-collapse text-center text-sm tabular-nums">
        <thead>
          <tr>
            <th
              scope="col"
              className="border border-line bg-surface-muted px-1.5 py-2 font-semibold"
            >
              ×
            </th>
            {RANGE.map((n) => (
              <th
                key={`col-${n}`}
                scope="col"
                className={`border border-line px-1.5 py-2 font-semibold ${
                  highlightTables.includes(n)
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-muted"
                }`}
              >
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RANGE.map((row) => (
            <tr key={`row-${row}`}>
              <th
                scope="row"
                className={`border border-line px-1.5 py-2 font-semibold ${
                  highlightTables.includes(row)
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-muted"
                }`}
              >
                {row}
              </th>
              {RANGE.map((col) => {
                const hot =
                  highlightTables.includes(row) ||
                  highlightTables.includes(col);
                return (
                  <td
                    key={`${row}x${col}`}
                    className={`border border-line px-1.5 py-2 ${
                      row === col
                        ? "bg-bg-accent font-semibold"
                        : hot
                          ? "bg-accent-soft/40"
                          : ""
                    }`}
                  >
                    {row * col}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
