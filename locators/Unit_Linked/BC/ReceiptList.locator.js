export const search_ReceiptList = (page) => ({
    receiptlist_txtrequestcode: (requestcode) => page.locator('input[id="criteria.proposalNo"]').fill(requestcode),
    receiptlist_txtfromdate: page.locator('input[id="criteria.fromPaymentDate"]'),
    receiptlist_txttodate: page.locator('input[id="criteria.toPaymentDate"]'),
    receiptlist_btnsearch: () => page.locator('#oSearch'),
})