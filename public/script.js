document.getElementById('redeemForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const activationKey = document.getElementById('activationKey').value;
    const serverLink = document.getElementById('serverLink').value;

    const response = await fetch('/redeem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activationKey, serverLink })
    });

    const result = await response.json();
    alert(result.message);
});