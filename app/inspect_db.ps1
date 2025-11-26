$server = "34.151.220.93"
$database = "incidentmanagement"
$user = "sqlserver"
$password = "Roam_2025"

$connectionString = "Server=$server;Database=$database;User Id=$user;Password=$password;TrustServerCertificate=True;"

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()
    Write-Host "Connected to SQL Server!"

    $query = "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'"
    $command = $connection.CreateCommand()
    $command.CommandText = $query
    
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $command
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) | Out-Null
    
    $dataset.Tables[0] | Format-Table -AutoSize
    
    $connection.Close()
}
catch {
    Write-Error "Database connection failed: $_"
}
