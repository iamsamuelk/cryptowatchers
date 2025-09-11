import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  return `${Math.floor(diffInSeconds / 3600)}h ago`;
};

const API_ENDPOINT = "https://hook.eu2.make.com/wqx754uotchgjre956dcee7ooda6bc21";

// Fetch crypto data from Make.com webhook
const fetchCryptoData = async (): Promise<CryptoData[]> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different possible response structures
    let cryptoArray = Array.isArray(data) ? data : data.data || data.coins || [data];
    
    // Transform API data to our CryptoData interface
    return cryptoArray.map((item: any, index: number) => ({
      id: item.id || item.name?.toLowerCase() || `crypto-${index}`,
      name: item.name || item.coin_name || 'Unknown',
      symbol: item.symbol || item.coin_symbol || 'N/A',
      price: parseFloat(item.price || item.current_price || item.price_usd || 0),
      change24h: parseFloat(item.change24h || item.price_change_percentage_24h || item.change_24h || 0),
      marketCap: parseFloat(item.market_cap || item.marketCap || item.market_cap_usd || 0),
      volume24h: parseFloat(item.volume24h || item.total_volume || item.volume_24h || 0),
      logo: item.logo || item.image || item.symbol?.charAt(0) || '₿',
      rank: parseInt(item.rank || item.market_cap_rank || index + 1),
      lastUpdated: item.last_updated || item.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw error;
  }
};

export default function CryptoDashboard() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState(new Date());

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
  const cryptoData: CryptoData[] = apiData || mockData;
  const significantMoves = cryptoData.filter(crypto => Math.abs(crypto.change24h) > 5);
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
            <p className="text-lg font-medium">Connecting to Make.com webhook...</p>
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
              {error instanceof Error ? error.message : 'Unable to connect to Make.com webhook'}
            </p>
            <p className="text-sm text-danger-foreground/60">
              Displaying demo data. Click refresh to retry connection.
            </p>
          </div>
        </Card>
      )}

      {/* Alerts Section */}
      {significantMoves.length > 0 && (
        <Card className="bg-gradient-card border-primary/20 shadow-glow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Price Alerts</h2>
              <Badge variant="outline" className="ml-auto">
                {significantMoves.length} active
              </Badge>
            </div>
            <div className="space-y-3">
              {significantMoves.map(crypto => (
                <div key={crypto.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{crypto.logo}</span>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(crypto.price)}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      crypto.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {crypto.change24h >= 0 ? 
                        <TrendingUp className="w-3 h-3" /> : 
                        <TrendingDown className="w-3 h-3" />
                      }
                      {Math.abs(crypto.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Crypto Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cryptoData.map((crypto) => (
          <Card key={crypto.id} className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 group">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{crypto.logo}</div>
                  <div>
                    <h3 className="font-bold text-lg">{crypto.name}</h3>
                    <p className="text-muted-foreground text-sm">{crypto.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{crypto.rank}
                  </Badge>
                  {crypto.rank <= 3 && (
                    <span className={`text-lg ${
                      crypto.rank === 1 ? 'text-crypto-gold' :
                      crypto.rank === 2 ? 'text-crypto-silver' : 
                      'text-crypto-bronze'
                    }`}>
                      {crypto.rank === 1 ? '🥇' : crypto.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
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

      {/* Footer */}
      <div className="text-center text-muted-foreground text-sm">
        <p>
          {isUsingLiveData 
            ? 'Connected to Make.com webhook • Auto-refresh every 30 seconds' 
            : 'Demo mode • Connect to Make.com webhook for live data'
          }
        </p>
      </div>
    </div>
  );
}