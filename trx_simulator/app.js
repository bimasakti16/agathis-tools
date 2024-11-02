document.getElementById('execute-flow').addEventListener('click', async () => {
    
    const outputElement = document.getElementById('output');

    // Helper function to update the output
    // const updateOutput = (text) => outputElement.textContent += text + '\n\n';

    // Helper function to update the output at the top
    const updateOutput = (text) => {
        outputElement.textContent = text + '\n\n' + outputElement.textContent;
    };

    // Step 2: Execute the second API call (checkout)
    const accountDecode = await fetch('https://3a-api-dev.ainosi.id/api/v1/account/decode', {
        method: 'POST',
        headers: {
            'Origin': 'https://pos-tmr.ainosi.com',
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            code: "f221fc4dda71ad4edbd296f58a346239d5789505b02bd5a52c448e90801062d1"
        })
    });
    const checkoutResponse = await accountDecode.json();

    const responseToken = checkoutResponse.data.token;
    
    const startTime = Date.now();

    const token = "Bearer " + responseToken;
    
    // Step 1: Execute the first API call (update cart)
    const updateCart = await fetch('https://3a-api-dev.ainosi.id/api/v1/cart/update', {
        method: 'POST',
        headers: {
            'Origin': 'https://pos-tmr.ainosi.com',
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            partner_code: "010000026",
            merchant_code: "020001032",
            destination_mid: "020001032",
            ticket_id: "5d2b3310-4df8-45b5-b1fd-9c3cc6d32931",
            qty: 1,
            enabled: true,
            flag_cart: "keranjang",
            visit_date: "2024-11-30"
        })
    });
    const updateCartResponse = await updateCart.json();
    updateOutput("Update Cart Response: " + JSON.stringify(updateCartResponse));

    // Step 2: Execute the second API call (checkout)
    const checkout = await fetch('https://3a-api-dev.ainosi.id/api/v1/cart/checkout', {
        method: 'POST',
        headers: {
            'Origin': 'https://pos-tmr.ainosi.com',
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            channel_type: "GATE",
            payment_partner_name: "AINO_KUE",
            payment_method: "JAKCARD"
        })
    });
    const checkoutResponse = await checkout.json();
    updateOutput("Checkout Response: " + JSON.stringify(checkoutResponse));

    const refNo = checkoutResponse.data.ref_no;
    const unixTimeNow = Math.floor(Date.now() / 1000);
    const unixTimestamp = unixTimeNow.toString();

    // Step 3: Create signature
    const signatureString = `010000026|${refNo}|3|${unixTimestamp}`;
    const secretKey = "MDEwMDAwMDI2LWdlbmVyYWw6JDJ5JDEzJFM1ODZBdFF5bXYyWTVwS09sd25YeWVBSWNhcEZWOHVrR1ZKR25WSUo3UVVGS0lTZXJ2UDFX";

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secretKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureArrayBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureString));
    const encryptedSignature = Array.from(new Uint8Array(signatureArrayBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // updateOutput("Signature: " + signatureString);
    // updateOutput("Encrypted Signature: " + encryptedSignature);

    // Step 4: Execute the third API call (notify payment)
    const notifyPayment = await fetch('https://settlement-app-dev.ainosi.id/v1/payment/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            partner_code: "010000026",
            booking_code: refNo,
            amount: "3",
            payment: {
                id: unixTimestamp,
                timestamp: new Date().toISOString(),
                status: 1,
                message: "Success"
            },
            signature: encryptedSignature
        })
    });
    const notifyPaymentResponse = await notifyPayment.json();
    updateOutput("Notify Payment Response: " + JSON.stringify(notifyPaymentResponse));    

    // Calculate and display total execution time
    const endTime = Date.now();
    const executionTime = (endTime - startTime); // Time in seconds
    updateOutput("Total Execution Time: " + executionTime + " ms");
    updateOutput("===========================================================");
});
