import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Activity, Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  logo: string;
  rank: number;
  lastUpdated: string;
}

const mockData: CryptoData[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 68542.34,
    change24h: 2.34,
    marketCap: 1347000000000,
    volume24h: 28500000000,
    logo: "₿",
    rank: 1,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ethereum",
    name: "Ethereum", 
    symbol: "ETH",
    price: 3421.67,
    change24h: -1.23,
    marketCap: 411000000000,
    volume24h: 15200000000,
    logo: "Ξ",
    rank: 2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL", 
    price: 187.42,
    change24h: 8.76,
    marketCap: 88000000000,
    volume24h: 3200000000,
    logo: "◎",
    rank: 3,
    lastUpdated: new Date().toISOString(),
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatLargeNumber = (value: number) => {
  if (value >= 1e12) {
    const formatted = (value / 1e12);
    return `$${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}T`;
  }
  if (value >= 1e9) {
    const formatted = (value / 1e9);
    return `$${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}B`;
  }
  if (value >= 1e6) {
    const formatted = (value / 1e6);
    return `$${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
};

const formatTimeAgo = (timestamp: string) => {
  const sanitize = (s: string) => {
    if (!s) return new Date();
    const cleaned = s.replace(/'/g, '');
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? new Date() : d;
  };
  const now = new Date();
  const time = sanitize(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  return `${Math.floor(diffInSeconds / 3600)}h ago`;
};

// Convert Google Sheets URL to CSV export format
const SHEET_ID = "1WilDqy_AAzAxNTbY5g7pjOVDprO_yX8i00eZRNfth6I";
const API_ENDPOINT = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Parse CSV data into array of objects
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
};

// Fetch crypto data from Google Sheets
const fetchCryptoData = async (): Promise<CryptoData[]> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    // Transform CSV data to our CryptoData interface using exact column names
    return data.map((item: any, index: number) => {
      // Extract numeric ID from CoinGecko logo URL
      const extractNumericId = (logoUrl: string): number => {
        if (!logoUrl) return index + 1;
        const match = logoUrl.match(/\/images\/(\d+)\//);
        return match ? parseInt(match[1]) : index + 1;
      };

      return {
        id: item.coin_id || item.name?.toLowerCase().replace(/\s+/g, '-') || `crypto-${index}`,
        name: item.name || 'Unknown',
        symbol: item.symbol || 'N/A',
        price: parseFloat(item.last_price?.replace(/[,$]/g, '') || 0),
        change24h: parseFloat(item.last_change_pct || 0),
        marketCap: parseFloat(item.market_cap?.replace(/[,$]/g, '') || 0),
        volume24h: parseFloat(item.volume?.replace(/[,$]/g, '') || 0),
        logo: item.logo_url || '₿',
        rank: extractNumericId(item.logo_url),
        lastUpdated: item.last_alert_timestamp || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching crypto data from Google Sheets:', error);
    throw error;
  }
};

export default function CryptoDashboard() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'marketCap' | 'volume24h'>('price');

  // Use React Query for data fetching with auto-refresh
  const { 
    data: apiData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['cryptoData'],
    queryFn: fetchCryptoData,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Use API data if available, otherwise fallback to mock data
  const sortedCryptoData = (apiData || mockData).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'marketCap':
        return b.marketCap - a.marketCap;
      case 'volume24h':
        return b.volume24h - a.volume24h;
      case 'price':
      default:
        return b.price - a.price;
    }
  });
  const cryptoData: CryptoData[] = sortedCryptoData;
  const topGainers = cryptoData.filter(crypto => crypto.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 3);
  const topLosers = cryptoData.filter(crypto => crypto.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 3);
  const isUsingLiveData = !!apiData && !isError;

  // Update last update time when data changes
  useEffect(() => {
    if (apiData) {
      setLastUpdate(new Date());
    }
  }, [apiData]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest crypto prices",
    });
  };

  // Show error toast when API fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Connection Error",
        description: "Using demo data. Check your internet connection.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Watcher
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              {isUsingLiveData ? (
                <><Wifi className="w-4 h-4 text-success" /> Live API</>
              ) : (
                <><WifiOff className="w-4 h-4 text-muted-foreground" /> Demo Mode</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefetching}
            className="animate-pulse-slow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Updating...' : 'Refresh'}
          </Button>
          <Button variant="outline" className={isUsingLiveData ? "animate-pulse-slow" : ""}>
            <Activity className="w-4 h-4 mr-2" />
            {isUsingLiveData ? 'Live' : 'Demo'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-gradient-card border-primary/20">
          <div className="p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Connecting to Google Sheets...</p>
            <p className="text-muted-foreground">Fetching latest crypto data</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="bg-gradient-danger border-danger/20">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff className="w-5 h-5 text-danger-foreground" />
              <h2 className="text-lg font-semibold text-danger-foreground">API Connection Failed</h2>
            </div>
            <p className="text-danger-foreground/80 mb-3">
              {error instanceof Error ? error.message : 'Unable to connect to Google Sheets'}
            </p>
            <p className="text-sm text-danger-foreground/60">
              Displaying demo data. Click refresh to retry connection.
            </p>
          </div>
        </Card>
      )}

      {/* Top Gainers Section */}
      {topGainers.length > 0 && (
        <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20 shadow-glow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-success">Top Gainers</h2>
              <Badge variant="outline" className="ml-auto border-success/30 text-success">
                +{topGainers.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {topGainers.map(crypto => (
                <div 
                  key={crypto.id} 
                  className="flex items-center justify-between p-3 bg-success/10 rounded-lg cursor-pointer hover:bg-success/20 transition-colors"
                  onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <img src={crypto.logo} alt={`${crypto.name} logo`} loading="lazy" className="w-8 h-8 rounded-full" onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} />
                    <span className="text-2xl hidden">{crypto.symbol.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(crypto.price)}</p>
                    <div className="flex items-center gap-1 text-sm text-success">
                      <TrendingUp className="w-3 h-3" />
                      +{crypto.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top Losers Section */}
      {topLosers.length > 0 && (
        <Card className="bg-gradient-to-r from-danger/10 to-danger/5 border-danger/20 shadow-glow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-danger" />
              <h2 className="text-xl font-semibold text-danger">Top Losers</h2>
              <Badge variant="outline" className="ml-auto border-danger/30 text-danger">
                -{topLosers.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {topLosers.map(crypto => (
                <div 
                  key={crypto.id} 
                  className="flex items-center justify-between p-3 bg-danger/10 rounded-lg cursor-pointer hover:bg-danger/20 transition-colors"
                  onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <img src={crypto.logo} alt={`${crypto.name} logo`} loading="lazy" className="w-8 h-8 rounded-full" onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} />
                    <span className="text-2xl hidden">{crypto.symbol.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(crypto.price)}</p>
                    <div className="flex items-center gap-1 text-sm text-danger">
                      <TrendingDown className="w-3 h-3" />
                      {crypto.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* All Cryptocurrencies */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">All Cryptocurrencies</h2>
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: 'price' | 'name' | 'marketCap' | 'volume24h') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="marketCap">Market Cap</SelectItem>
                <SelectItem value="volume24h">Volume 24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cryptoData.map((crypto) => (
            <Card 
              key={crypto.id} 
              className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 group cursor-pointer"
              onClick={() => window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank')}
            >
              <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={crypto.logo} alt={`${crypto.name} logo`} loading="lazy" className="w-12 h-12 rounded-full" onError={(e) => {
                       e.currentTarget.style.display = 'none';
                       e.currentTarget.nextElementSibling?.classList.remove('hidden');
                     }} />
                    <div className="text-3xl hidden">{crypto.symbol.charAt(0)}</div>
                    <div>
                      <h3 className="font-bold text-lg">{crypto.name}</h3>
                      <p className="text-muted-foreground text-sm">{crypto.symbol}</p>
                    </div>
                  </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{crypto.rank}
                  </Badge>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-2xl font-bold">{formatCurrency(crypto.price)}</p>
                <div className={`flex items-center gap-1 ${
                  crypto.change24h >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {crypto.change24h >= 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span className="font-medium">
                    {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                  </span>
                  <span className="text-xs text-muted-foreground">24h</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Market Cap</span>
                  </div>
                  <span className="font-medium">{formatLargeNumber(crypto.marketCap)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Volume 24h</span>
                  </div>
                  <span className="font-medium">{formatLargeNumber(crypto.volume24h)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(crypto.lastUpdated)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm space-y-1">
        <p>
          {isUsingLiveData 
            ? 'Connected to Google Sheets • Auto-refresh every 30 seconds' 
            : 'Demo mode • Connect to Google Sheets for live data'
          }
        </p>
        <p className="text-xs">
          All data sourced from CoinGecko
        </p>
      </div>
    </div>
  );
}