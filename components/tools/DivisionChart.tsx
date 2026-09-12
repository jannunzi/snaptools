type DivisionChartProps = {
  highlightDivisors?: number[];
  caption?: string;
};

const RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function DivisionChart({
  highlightDivisors = [],
  caption = "Division chart — cells are dividends (divisor × quotient), 1 through 12",
}: DivisionChartProps) {
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
              ÷
            </th>
            {RANGE.map((n) => (
              <th
                key={`col-${n}`}
                scope="col"
                className="border border-line bg-surface-muted px-1.5 py-2 font-semibold"
              >
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RANGE.map((divisor) => (
            <tr key={`row-${divisor}`}>
              <th
                scope="row"
                className={`border border-line px-1.5 py-2 font-semibold ${
                  highlightDivisors.includes(divisor)
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-muted"
                }`}
              >
                {divisor}
              </th>
              {RANGE.map((quotient) => {
                const hot = highlightDivisors.includes(divisor);
                return (
                  <td
                    key={`${divisor}x${quotient}`}
                    className={`border border-line px-1.5 py-2 ${
                      divisor === quotient
                        ? "bg-bg-accent font-semibold"
                        : hot
                          ? "bg-accent-soft/40"
                          : ""
                    }`}
                  >
                    {divisor * quotient}
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
