const STORAGE_KEY = "privipay_contracts";

interface ContractEntry {
  address: string;
  name: string;
  ownerAddress: string;
  createdAt: string;
}

function load(): Record<string, ContractEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, ContractEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const contractStore = {
  add(address: string, name: string, ownerAddress: string) {
    const data = load();
    data[address.toLowerCase()] = {
      address: address.toLowerCase(),
      name,
      ownerAddress: ownerAddress.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    save(data);
  },

  get(address: string): ContractEntry | null {
    const data = load();
    return data[address.toLowerCase()] || null;
  },

  getByOwner(ownerAddress: string): ContractEntry | null {
    const data = load();
    return Object.values(data).find(
      e => e.ownerAddress === ownerAddress.toLowerCase()
    ) || null;
  },

  list(): ContractEntry[] {
    return Object.values(load());
  },

  remove(address: string) {
    const data = load();
    delete data[address.toLowerCase()];
    save(data);
  },
};
