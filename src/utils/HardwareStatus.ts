export interface HardwareSpec {
    modelName: string;
    manufacturer: string;
    specifications: Record<string, string>;
    description: string;
}

export const HARDWARE_SPECS: Record<string, HardwareSpec> = {
    solar: {
        modelName: "Agrisolar PV-450M",
        manufacturer: "EcoPower Solutions",
        description: "Monocrystalline silicon photovoltaic module with high efficiency design, optimized for off-grid tropical farming.",
        specifications: {
            "Max Power (Pmax)": "450 W",
            "Open Circuit Voltage (Voc)": "49.6 V",
            "Short Circuit Current (Isc)": "11.5 A",
            "Cell Type": "Monocrystalline Silicon",
            "Efficiency": "20.7%",
            "Weight": "23.5 kg",
            "Battery Chemistry": "LiFePO4 (Lithium Iron Phosphate)",
            "Battery Capacity": "2.4 kWh (48V 50Ah)",
            "Charge Controller": "Smart MPPT 150V/45A"
        }
    },
    pump: {
        modelName: "AuraFlow 12-DC-HighPressure",
        manufacturer: "SolIrrigate Tech",
        description: "Brushless 12V DC positive displacement diaphragm pump with built-in electronic pulse control and dry-run safety sensor.",
        specifications: {
            "Operating Voltage": "12 V DC",
            "Power consumption": "95 W",
            "Max Flow Rate": "1,080 L/h (18 L/min)",
            "Max Pressure": "8.5 Bar (120 PSI)",
            "Max Head": "45 meters",
            "Operating RPM": "3,600 RPM",
            "Suction Lift": "2.5 meters",
            "Connection Port": "1/2 inch NPT"
        }
    },
    valve: {
        modelName: "Solenoid-S24N",
        manufacturer: "Uganda Valve Corp",
        description: "Normally closed action direct-acting solenoid valve with heavy duty brass valve body and waterproof epoxy coil.",
        specifications: {
            "Actuator Type": "Direct Electromagnetic Solenoid",
            "Control Voltage": "12V DC (Pulse Driven)",
            "State Indication": "0° (Closed/Idle) to 90° (Open/Flowing)",
            "Body Material": "Forge Brass / NBR Seal",
            "Working Pressure": "0.2 - 10 Bar",
            "Response Time": "Open < 0.15s, Close < 0.3s",
            "Flow Coefficient (Cv)": "4.8"
        }
    },
    weather: {
        modelName: "MeteoStake-Pro V3",
        manufacturer: "AgriSense Instruments",
        description: "Unified agricultural microclimate transmitter collecting surface wind metrics, precipitation accumulation, and atmospheric pressure.",
        specifications: {
            "Anemometer Type": "3-Cup Physical Rotor",
            "Wind Speed Accuracy": "±0.3 m/s",
            "Rain Gauge": "Self-emptying tipping bucket (0.2mm resolution)",
            "Air Temperature Range": "-40°C to +65°C (±0.2°C)",
            "Barometric Sensor": "MEMS Piezo-resistive",
            "Telemetry Protocol": "LoraWAN Class A (868 MHz)",
            "Solar Aux Power": "2W Integrated PV"
        }
    },
    sensor: {
        modelName: "SoilStake-Capacitive V2",
        manufacturer: "AgriSense Instruments",
        description: "Multi-depth FDR (Frequency Domain Reflectometry) capacitive probe reading dielectric permittivity to calculate volumetric water content (VWC).",
        specifications: {
            "Microcontroller": "ESP32-S3 LoRa SoC",
            "RF Transceiver": "SX1262 LoRa WAN Sub-GHz",
            "RF Band": "868 MHz ISM (Mbarara licensed)",
            "Battery Source": "3.2V 18650 LiFePO4 battery (included)",
            "Expected Charge Life": "365 days (15 min update interval)",
            "Probe Depth Ranges": "10cm, 20cm, 30cm, 45cm Options",
            "Interface": "Capacitive dry-soil calibration preset"
        }
    },
    greenhouse: {
        modelName: "Greenhouse Complex-G1",
        manufacturer: "East Africa Agri-Structures Ltd",
        description: "Galvanized structural steel tube frame greenhouse with UV-resistant scatter-film polythene glazing.",
        specifications: {
            "Structure Glazing": "200 Micron UV Diffused Film",
            "Frame Material": "Hot-dip Galvanized Steel (Class A)",
            "Ventilation System": "Roll-up side curtains & insect mesh screens",
            "Cooling Auxiliary Fans": "Dual 12V PV-powered extraction fans",
            "Dimensions": "20m(L) x 8m(W) x 3.5m(H)",
            "Irrigation Feed": "Suspended overhead micro-sprinklers & drip line grid"
        }
    },
    tank: {
        modelName: "AgriTower-5000S",
        manufacturer: "Jambo Plastics",
        description: "Heavy duty double-walled UV-stabilized polythene water tank on reinforced steel block gantry.",
        specifications: {
            "Liquid Capacity": "5,000 Litres",
            "Material": "Food-grade LLDPE (Linear Low-Density Polyethylene)",
            "Inlet/Outlet Size": "2.0 inch BSP / 1.5 inch BSP",
            "Support Structure": "1.8m elevated structural steel tower gantry",
            "Fertigation Mixer": "100L Venturi chemical proportioner pump adjacent"
        }
    }
};
