// format data in accordance with ISO 8601 with ms
function formatDate(date) {
    return date.toISOString()
}

export function updateRuns(runs) {
    // Current time
    const now = new Date()

    // Date picker 'Past hour' (get past 45 min)
    const oneHourAgo = new Date(now.getTime() - (45 * 60 * 1000))

    // Date picker 'Past 24h' (get past 20h)
    const oneDayAgo = new Date(now.getTime() - (20 * 60 * 60 * 1000))  

    // update start_time та last_update
    runs.runs = runs.runs.map(run => {
        if (['cf842616c89347c7bb7bca2c9e840a21', '76f48c8165da473bb4356ef7b196343f','f5751299ee21476e897dfd90d94c49c4', 'dad0fdf93bd949589f6b20f79fa47798', '59f8e3d6f3db4dd8ab890c4bf84a0a23' ]
            .includes(run.metadata.uid)) { 
            
            return { ...run, status: { ...run.status, start_time: formatDate(oneDayAgo), last_update: formatDate(oneDayAgo) } 
            } 
        } else if (['1d3a8b0833b74f55b008537b1e19ea57'].includes(run.metadata.uid)) { 
        
            return { ...run, status: { ...run.status, start_time: formatDate(oneHourAgo), last_update: formatDate(oneHourAgo)}
            } 
        } else {
            return run
        }
    })
}
