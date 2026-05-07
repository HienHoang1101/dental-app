# Test script to call the schedule API and see the error
# Replace with your actual JWT token and doctor info

$baseUrl = "http://localhost:8080"
$token = "YOUR_JWT_TOKEN_HERE"  # Replace with actual token

# Test data
$body = @{
    dayOfWeek = 1
    session = "morning"
    startTime = "08:00"
    endTime = "12:00"
} | ConvertTo-Json

Write-Host "Testing POST /api/doctor/weekly-schedules" -ForegroundColor Cyan
Write-Host "Request body: $body" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "$baseUrl/api/doctor/weekly-schedules" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "Error! Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error Response: $responseBody" -ForegroundColor Red
}
