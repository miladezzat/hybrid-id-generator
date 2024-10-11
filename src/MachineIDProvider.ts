//src/MachineIDProvider.ts
import os from 'os';
import crypto from 'crypto';

export type MachineIDStrategy = 'env' | 'network' | 'random' | undefined;

/**
 * Interface for machine ID providers.
 * Allows different strategies for generating or retrieving the machine ID.
 */
export interface MachineIDProvider {
    getMachineId(): number;
}

/**
 * Environment-based machine ID provider.
 * Retrieves the machine ID from a specified environment variable and caches it.
 */
export class EnvMachineIDProvider implements MachineIDProvider {
    private envVarName: string;
    private cachedMachineId: number | null = null; // Cache variable for the machine ID

    constructor(envVarName: string = 'MACHINE_ID') {
        this.envVarName = envVarName;
    }

    getMachineId(): number {
        // Return cached value if available
        if (this.cachedMachineId !== null) {
            return this.cachedMachineId;
        }

        const machineIdStr = process.env[this.envVarName];
        if (!machineIdStr) {
            throw new Error(`Environment variable ${this.envVarName} is not defined`);
        }
        const machineId = parseInt(machineIdStr, 10);
        if (isNaN(machineId) || machineId < 0) {
            throw new Error(`Invalid MACHINE_ID from environment variable: ${this.envVarName}`);
        }

        // Cache the retrieved machine ID
        this.cachedMachineId = machineId;
        return machineId;
    }
}

/**
 * Network-based machine ID provider.
 * Generates a machine ID based on the MAC address of the network interface and caches it.
 * This provider can handle multiple MAC addresses and offers configuration options.
 */
export class NetworkMachineIDProvider implements MachineIDProvider {
    private interfaceName?: string; // Optional interface name to target specific interface
    private cachedMachineId: number | null = null; // Cache variable for the machine ID

    /**
     * @param interfaceName Optional name of the network interface to use.
     * If not provided, the first valid MAC address found will be used.
     */
    constructor(interfaceName?: string) {
        this.interfaceName = interfaceName;
    }

    getMachineId(): number {
        // Return cached value if available
        if (this.cachedMachineId !== null) {
            return this.cachedMachineId;
        }

        const interfaces = os.networkInterfaces();
        let mac: string | undefined;

        if (this.interfaceName) {
            // Look for the specified interface name
            const iface = interfaces[this.interfaceName];
            if (iface) {
                mac = this.getValidMac(iface);
            }
        } else {
            // If no specific interface, search all interfaces for a valid MAC
            for (const iface of Object.values(interfaces)) {
                if (iface) {
                    mac = this.getValidMac(iface);
                    if (mac) break; // Stop once a valid MAC is found
                }
            }
        }

        if (!mac) {
            throw new Error("Unable to determine machine ID based on network interface");
        }

        // Cache the generated machine ID
        this.cachedMachineId = this.hashMacToMachineId(mac);
        return this.cachedMachineId;
    }

    private getValidMac(iface: os.NetworkInterfaceInfo[]): string | undefined {
        for (const { mac } of iface) {
            if (mac && mac !== '00:00:00:00:00:00') {
                return mac; // Return the first valid MAC address found
            }
        }
        return undefined; // No valid MAC found
    }

    private hashMacToMachineId(mac: string): number {
        // Simplified hash to convert MAC address to machine ID (limited to a range)
        return parseInt(mac.replace(/:/g, ''), 16) % 1024;
    }
}

/**
 * Random machine ID provider.
 * Generates a random machine ID within a specified range.
 * This implementation uses cryptographic random values to improve security and reduce predictability.
 */
export class RandomMachineIDProvider implements MachineIDProvider {
    private maxMachineId: number;

    /**
     * @param maxMachineId Maximum value for the machine ID. Defaults to 1023.
     */
    constructor(maxMachineId: number = 1023) {
        this.maxMachineId = maxMachineId;
    }

    getMachineId(): number {
        return this.generateRandomMachineId();
    }

    private generateRandomMachineId(): number {
        const randomValue = this.getCryptographicRandomValue(4); // Get a random 4-byte value
        return randomValue % (this.maxMachineId + 1); // Ensure it stays within the maxMachineId range
    }

    private getCryptographicRandomValue(byteSize: number): number {
        const buffer = crypto.randomBytes(byteSize); // Generate cryptographic random bytes
        return buffer.readUInt32BE(0); // Convert first 4 bytes to an unsigned 32-bit integer
    }
}

/**
 * Factory for creating MachineIDProvider based on strategy.
 */
export class MachineIDProviderFactory {
    /**
     * Create a MachineIDProvider based on the strategy and a single var that is interpreted based on the strategy.
     * - If the strategy is 'env', the var is treated as envVarName.
     * - If the strategy is 'random', the var is treated as maxMachineId.
     * - 'network' strategy doesn't require an additional var.
     */
    static createMachineIDProvider(strategy: MachineIDStrategy, value?: string | number): MachineIDProvider {
        switch (strategy) {
            case 'env':
                return new EnvMachineIDProvider(value as string); // Use value as envVarName
            case 'network':
                return new NetworkMachineIDProvider(); // No additional value needed
            case 'random':
                return new RandomMachineIDProvider(value as number); // Use value as maxMachineId
            default:
                throw new Error(`Invalid machine ID strategy: ${strategy}`);
        }
    }
}
