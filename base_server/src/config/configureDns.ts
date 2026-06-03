import dns from 'dns'

/**
 * Node on Windows can fail mongodb+srv (querySrv ECONNREFUSED) while system DNS works.
 * Configurable via DNS_SERVERS (comma-separated), e.g. "1.1.1.1,8.8.8.8"
 */
export function configureDns(): void {
    const fromEnv = process.env.DNS_SERVERS
    if (fromEnv !== undefined && fromEnv.trim().length > 0) {
        const servers = fromEnv
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
        if (servers.length > 0) {
            dns.setServers(servers)
        }
        return
    }

    const databaseUrl = process.env.DATABASE_URL ?? ''
    if (
        process.env.ENV === 'development' ||
        process.env.NODE_ENV === 'development' ||
        databaseUrl.includes('mongodb+srv://')
    ) {
        dns.setServers(['1.1.1.1', '8.8.8.8'])
    }
}
