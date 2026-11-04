# 0004: keep long order tables responsive

The explorer uses TanStack Table 8 and TanStack Virtual 3. Tables with more than 200 rows render a window of rows as the person scrolls. Smaller histories render in full. The table still reports its complete row count, and searching, filtering, sorting and downloading use every order.

Parsed search parameters are memoised. A fresh object on each render would unnecessarily rebuild the table's data and could create a render loop when the viewport changes. URL changes still update the filters immediately.
