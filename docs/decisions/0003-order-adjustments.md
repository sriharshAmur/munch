# 0003: preserve order adjustments separately

An order can change after it was placed. Money now includes a signed `adjustments` amount in whole cents, defaulting to zero for existing Munch files. It is separate from delivery fees, tips and discounts. The order total includes this adjustment.

Account credit is a way to pay, not a discount. Total spend measures the value of the order, including portions paid with account credit. This keeps the same definition across payment methods.

The history response already contains complete orders. The fetcher stores each one directly and follows the site's supplied next-page links. It does not make redundant detail requests. Sri explicitly requested reading his supplied cURL file; `--from-curl` supports that local handoff without printing or persisting the session elsewhere. Clipboard input remains the default.

A directly captured order can be absent from the history listing. Building keeps that capture when it belongs to the same account, then deduplicates by the source order id. A capture from another account is excluded. History order data takes precedence when both contain the same id.
