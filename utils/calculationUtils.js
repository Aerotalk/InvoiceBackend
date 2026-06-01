const parseTaxRate = (taxString) => {
    if (!taxString) return 0;
    const match = taxString.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
};

const calculateLineItem = (quantity, rate, taxString) => {
    const qty = parseFloat(quantity || 0);
    const rt = parseFloat(rate || 0);
    const amount = parseFloat((qty * rt).toFixed(2));
    
    const taxRate = parseTaxRate(taxString);
    const taxAmount = parseFloat(((amount * taxRate) / 100).toFixed(2));
    
    return {
        amount,
        taxAmount,
        totalWithTax: parseFloat((amount + taxAmount).toFixed(2))
    };
};

const calculateDocumentTotals = (items, discountValue = 0, discountType = 'amount', adjustment = 0) => {
    let subTotal = 0;
    let totalTax = 0;

    items.forEach(item => {
        subTotal += item.amount;
        totalTax += item.taxAmount;
    });

    // Apply discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subTotal * parseFloat(discountValue)) / 100;
    } else {
        discountAmount = parseFloat(discountValue);
    }

    // Usually discount is applied to the subtotal before tax, but in simple invoicing,
    // if tax was already calculated per item, we might need to adjust totalTax proportionally,
    // OR the tax was calculated considering the discount per item. 
    // Assuming discount is just applied to the final total amount for simplicity, 
    // or to the subTotal. Let's do it on SubTotal and adjust Tax if required, 
    // but the system has items with individual tax, so discount typically acts as a flat reduction here.
    // Let's just reduce it from totalAmount.
    
    // So total = subTotal + totalTax - discountAmount + adjustment
    // To match standard accounting where discount is on subTotal:
    
    const totalAmount = parseFloat((subTotal + totalTax - discountAmount + parseFloat(adjustment)).toFixed(2));

    return {
        subTotal: parseFloat(subTotal.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        totalAmount: totalAmount > 0 ? totalAmount : 0
    };
};

const calculateTaxSplit = (totalTax, isInterState = false) => {
    if (isInterState) {
        return {
            igst: parseFloat(totalTax.toFixed(2)),
            sgst: 0,
            cgst: 0
        };
    } else {
        const half = parseFloat((totalTax / 2).toFixed(2));
        return {
            igst: 0,
            sgst: half,
            cgst: half
        };
    }
};

module.exports = {
    parseTaxRate,
    calculateLineItem,
    calculateDocumentTotals,
    calculateTaxSplit
};
