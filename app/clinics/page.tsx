"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAllClinics, getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicReviews, calculateAverageRating } from '@/lib/reviews';
import { getClinicStaff } from '@/lib/staff';
import { Search, MapPin, Star, Clock, Filter, SlidersHorizontal, ArrowRight, Navigation2, Shield, CreditCard, Baby, Accessibility, Car, Building2, X, ChevronDown, ArrowUpDown } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  rating: number;
  reviewCount: number;
  services: string[];
  image?: string;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  acceptsInsurance?: boolean;
  hasParking?: boolean;
  wheelchairAccessible?: boolean;
  childFriendly?: boolean;
  emergencyAppointments?: boolean;
  eveningHours?: boolean;
  weekendHours?: boolean;
}

// Helper function to load real clinics data
function loadRealClinics(): Clinic[] {
  const clinics = getAllClinics();
  const currentClinic = getCurrentClinic();
  
  // Include current clinic if logged in
  const allClinics = [...clinics];
  if (currentClinic && !allClinics.find(c => c.id === currentClinic.id)) {
    allClinics.push(currentClinic);
  }
  
  // Only show approved clinics
  const approvedClinics = allClinics.filter(c => c.status === 'approved');
  
  // Transform to Clinic interface with real data
  return approvedClinics.map(clinic => {
    const reviews = getClinicReviews(clinic.id);
    const staff = getClinicStaff(clinic.id);
    
    // Collect services from staff
    const allServices = new Set<string>();
    staff.forEach(s => {
      if (s.services) {
        s.services.forEach((service: string) => allServices.add(service));
      }
    });
    
    // Calculate rating from reviews
    const rating = reviews.length > 0 ? calculateAverageRating(reviews) : 0;
    
    // Check working hours for evening/weekend
    const workingHours = clinic.workingHours || [];
    const hasEveningHours = workingHours.some(wh => {
      if (wh.closed) return false;
      const [openHour] = wh.open.split(':').map(Number);
      const [closeHour] = wh.close.split(':').map(Number);
      return closeHour >= 18; // After 6 PM
    });
    const hasWeekendHours = workingHours.some(wh => {
      const weekendDays = ['Cumartesi', 'Pazar'];
      return weekendDays.includes(wh.day) && !wh.closed;
    });
    
    return {
      id: clinic.id,
      name: clinic.clinicName,
      address: clinic.address,
      city: clinic.city,
      district: clinic.district,
      rating,
      reviewCount: reviews.length,
      services: Array.from(allServices),
      verified: clinic.verified || false,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      acceptsInsurance: clinic.acceptedInsurances && clinic.acceptedInsurances.length > 0,
      hasParking: clinic.parkingInfo && clinic.parkingInfo.length > 0,
      wheelchairAccessible: clinic.accessibility?.wheelchair || false,
      childFriendly: clinic.specialties?.some(s => s.toLowerCase().includes('çocuk') || s.toLowerCase().includes('pedodonti')) || false,
      emergencyAppointments: !!clinic.emergencyContact,
      eveningHours: hasEveningHours,
      weekendHours: hasWeekendHours,
    };
  });
}

// Mesafe hesaplama fonksiyonu (Haversine formülü)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ClinicsPageContent() {
  const searchParams = useSearchParams();
  const [searchCity, setSearchCity] = useState('');
  const [searchService, setSearchService] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name' | 'distance'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  
  // Yeni filtreler
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [childFriendly, setChildFriendly] = useState(false);
  const [emergencyAppointments, setEmergencyAppointments] = useState(false);
  const [eveningHours, setEveningHours] = useState(false);
  const [weekendHours, setWeekendHours] = useState(false);

  // Load real clinics data
  useEffect(() => {
    const clinics = loadRealClinics();
    setAllClinics(clinics);
    setFilteredClinics(clinics);
  }, []);

  // Kullanıcı konumunu al
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Konum alınamazsa İstanbul merkezini varsayılan olarak kullan
          setUserLocation({ lat: 41.0082, lon: 28.9784 });
        }
      );
    } else {
      // Geolocation desteklenmiyorsa İstanbul merkezini varsayılan olarak kullan
      setUserLocation({ lat: 41.0082, lon: 28.9784 });
    }
  }, []);

  useEffect(() => {
    // URL parametrelerinden filtreleri yükle
    const cityParam = searchParams?.get('city');
    const serviceParam = searchParams?.get('service');
    
    if (cityParam) {
      setSearchCity(cityParam);
      setSelectedCities([cityParam]);
    }
    if (serviceParam) {
      setSearchService(serviceParam);
      setSelectedServices([serviceParam]);
    }
  }, [searchParams]);

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa'];
  const services = [
    'Diş Temizliği',
    'Dolgu',
    'Kanal Tedavisi',
    'İmplant',
    'Ortodonti',
    'Protez',
    'Estetik Diş Hekimliği',
  ];

  const handleSearch = () => {
    let filtered = [...allClinics];

    // Şehir filtresi
    if (searchCity.trim()) {
      filtered = filtered.filter(
        (clinic) =>
          clinic.city.toLowerCase().includes(searchCity.toLowerCase()) ||
          clinic.district.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    // Şehir filtresi (çoklu seçim)
    if (selectedCities.length > 0) {
      filtered = filtered.filter((clinic) => selectedCities.includes(clinic.city));
    }

    // Hizmet filtresi (çoklu seçim)
    if (selectedServices.length > 0) {
      filtered = filtered.filter((clinic) =>
        selectedServices.some((service) =>
          clinic.services.some((s) => s === service || s.toLowerCase().includes(service.toLowerCase()))
        )
      );
    }

    if (searchService.trim()) {
      filtered = filtered.filter((clinic) =>
        clinic.services.some((s) =>
          s.toLowerCase().includes(searchService.toLowerCase())
        )
      );
    }

    // Minimum puan filtresi
    if (minRating > 0) {
      filtered = filtered.filter((clinic) => clinic.rating >= minRating);
    }

    // Doğrulanmış klinikler
    if (onlyVerified) {
      filtered = filtered.filter((clinic) => clinic.verified);
    }

    // Sigorta kabul eden
    if (acceptsInsurance) {
      filtered = filtered.filter((clinic) => clinic.acceptsInsurance);
    }

    // Park yeri
    if (hasParking) {
      filtered = filtered.filter((clinic) => clinic.hasParking);
    }

    // Engelli erişimi
    if (wheelchairAccessible) {
      filtered = filtered.filter((clinic) => clinic.wheelchairAccessible);
    }

    // Çocuk dostu
    if (childFriendly) {
      filtered = filtered.filter((clinic) => clinic.childFriendly);
    }

    // Acil randevu
    if (emergencyAppointments) {
      filtered = filtered.filter((clinic) => clinic.emergencyAppointments);
    }

    // Akşam saatleri
    if (eveningHours) {
      filtered = filtered.filter((clinic) => clinic.eveningHours);
    }

    // Hafta sonu
    if (weekendHours) {
      filtered = filtered.filter((clinic) => clinic.weekendHours);
    }

    // Mesafe hesaplama ve sıralama
    if (sortBy === 'distance' && userLocation) {
      filtered = filtered.map((clinic) => {
        if (clinic.latitude && clinic.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            clinic.latitude,
            clinic.longitude
          );
          return { ...clinic, distance };
        }
        return { ...clinic, distance: Infinity };
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'distance') {
        const distA = (a as any).distance || Infinity;
        const distB = (b as any).distance || Infinity;
        return distA - distB;
      }
      return 0;
    });

    setFilteredClinics(filtered);
  };

  // Dropdown'ları dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCityDropdown(false);
        setShowServiceDropdown(false);
      }
    };

    if (showCityDropdown || showServiceDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCityDropdown, showServiceDropdown]);

  // Filtreleme fonksiyonu - her filtre değiştiğinde otomatik çalışır
  useEffect(() => {
    if (allClinics.length > 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCities, selectedServices, searchCity, searchService, minRating, onlyVerified, acceptsInsurance, hasParking, wheelchairAccessible, childFriendly, emergencyAppointments, eveningHours, weekendHours, sortBy, userLocation, allClinics]);

  const clearFilters = () => {
    setSearchCity('');
    setSearchService('');
    setSelectedCities([]);
    setSelectedServices([]);
    setMinRating(0);
    setOnlyVerified(false);
    setAcceptsInsurance(false);
    setHasParking(false);
    setWheelchairAccessible(false);
    setChildFriendly(false);
    setEmergencyAppointments(false);
    setEveningHours(false);
    setWeekendHours(false);
    setSortBy('rating');
    setFilteredClinics(allClinics);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <div className="px-4 md:px-6 py-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Klinikleri{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Keşfedin
              </span>
            </h1>
            <p className="text-slate-400 font-light max-w-2xl mx-auto">
              Türkiye'nin güvenilir diş kliniklerinden birini seçin
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3">
                <MapPin size={20} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Şehir veya ilçe"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent outline-none w-full text-white placeholder-slate-400 font-light"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 border-t md:border-t-0 md:border-l border-slate-700/50">
                <Search size={20} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Hizmet: Temizlik, İmplant, vb."
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent outline-none w-full text-white placeholder-slate-400 font-light"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Ara <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="max-w-7xl mx-auto mb-8 flex flex-row gap-3 md:gap-4 items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-initial">
              <span className="hidden md:inline text-sm text-slate-400 font-light">Sırala:</span>
              <div className="relative flex items-center gap-2 flex-1 md:flex-initial">
                <div className="md:hidden absolute left-3 z-10 pointer-events-none">
                  <ArrowUpDown size={16} className="text-slate-400" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'rating' | 'reviews' | 'name' | 'distance');
                  }}
                  className="px-4 py-2 pl-10 md:pl-4 text-xs md:text-sm bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50 md:min-w-[180px] w-full md:w-auto appearance-none"
                  style={{ fontSize: '0.75rem' }}
                >
                  <option value="rating">En Yüksek Puan</option>
                  <option value="reviews">En Çok Yorum</option>
                  <option value="name">İsme Göre</option>
                  <option value="distance">Yakından Uzağa</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 text-slate-400 pointer-events-none hidden md:block" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                Filtrele
              </button>
              {(selectedCities.length > 0 || selectedServices.length > 0 || searchCity || searchService || minRating > 0 || onlyVerified || acceptsInsurance || hasParking || wheelchairAccessible || childFriendly || emergencyAppointments || eveningHours || weekendHours) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="max-w-7xl mx-auto mb-8 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Şehir - Çoklu Seçim Dropdown */}
                <div className="relative dropdown-container">
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Şehir (Çoklu Seçim)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCityDropdown(!showCityDropdown);
                        setShowServiceDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light flex items-center justify-between"
                    >
                      <span className="text-left">
                        {selectedCities.length === 0
                          ? 'Şehir seçiniz'
                          : selectedCities.length === 1
                          ? selectedCities[0]
                          : `${selectedCities.length} şehir seçildi`}
                      </span>
                      <ChevronDown size={18} className={`transition ${showCityDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showCityDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {cities.map((city) => {
                            const isSelected = selectedCities.includes(city);
                            return (
                              <label
                                key={city}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCities([...selectedCities, city]);
                                    } else {
                                      setSelectedCities(selectedCities.filter((c) => c !== city));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm font-light text-slate-300">{city}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedCities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCities.map((city) => (
                        <span
                          key={city}
                          className="px-2 py-1 bg-blue-500/20 border border-blue-400/50 rounded text-xs text-blue-300 font-light flex items-center gap-1"
                        >
                          {city}
                          <button
                            onClick={() => {
                              setSelectedCities(selectedCities.filter((c) => c !== city));
                            }}
                            className="hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hizmet - Çoklu Seçim Dropdown */}
                <div className="relative dropdown-container">
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Hizmet (Çoklu Seçim)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowServiceDropdown(!showServiceDropdown);
                        setShowCityDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light flex items-center justify-between"
                    >
                      <span className="text-left">
                        {selectedServices.length === 0
                          ? 'Hizmet seçiniz'
                          : selectedServices.length === 1
                          ? selectedServices[0]
                          : `${selectedServices.length} hizmet seçildi`}
                      </span>
                      <ChevronDown size={18} className={`transition ${showServiceDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showServiceDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {services.map((service) => {
                            const isSelected = selectedServices.includes(service);
                            return (
                              <label
                                key={service}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedServices([...selectedServices, service]);
                                    } else {
                                      setSelectedServices(selectedServices.filter((s) => s !== service));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-sm font-light text-slate-300">{service}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedServices.map((service) => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-blue-500/20 border border-blue-400/50 rounded text-xs text-blue-300 font-light flex items-center gap-1"
                        >
                          {service}
                          <button
                            onClick={() => {
                              setSelectedServices(selectedServices.filter((s) => s !== service));
                            }}
                            className="hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Minimum Puan */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Minimum Puan
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={minRating}
                      onChange={(e) => {
                        setMinRating(parseFloat(e.target.value));
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-400 font-light min-w-[3rem]">
                      {minRating > 0 ? minRating.toFixed(1) : 'Tümü'}
                    </span>
                  </div>
                </div>

                {/* Özellikler */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Özellikler
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => {
                          setOnlyVerified(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Shield size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Sadece Doğrulanmış</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptsInsurance}
                        onChange={(e) => {
                          setAcceptsInsurance(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <CreditCard size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Sigorta Kabul Ediyor</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasParking}
                        onChange={(e) => {
                          setHasParking(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Car size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Park Yeri Var</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wheelchairAccessible}
                        onChange={(e) => {
                          setWheelchairAccessible(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Accessibility size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Engelli Erişimi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={childFriendly}
                        onChange={(e) => {
                          setChildFriendly(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Baby size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Çocuk Dostu</span>
                    </label>
                  </div>
                </div>

                {/* Çalışma Saatleri */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Çalışma Saatleri
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emergencyAppointments}
                        onChange={(e) => {
                          setEmergencyAppointments(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Acil Randevu</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eveningHours}
                        onChange={(e) => {
                          setEveningHours(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Akşam Saatleri (18:00+)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weekendHours}
                        onChange={(e) => {
                          setWeekendHours(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <Building2 size={16} className="text-slate-400" />
                      <span className="text-sm font-light text-slate-300">Hafta Sonu Açık</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 text-sm text-slate-400 font-light">
              {filteredClinics.length} klinik bulundu
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClinics.map((clinic) => (
                <Link
                  key={clinic.id}
                  href={`/clinics/${clinic.id}`}
                  className="group bg-slate-800/30 backdrop-blur border border-slate-700/30 hover:border-blue-500/50 rounded-xl p-6 transition duration-300 hover:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-light group-hover:text-blue-400 transition">
                          {clinic.name}
                        </h3>
                        {clinic.verified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                            Doğrulanmış
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-light mb-2">
                        <MapPin size={14} />
                        <span>
                          {clinic.district}, {clinic.city}
                        </span>
                        {sortBy === 'distance' && userLocation && (clinic as any).distance !== undefined && (clinic as any).distance !== Infinity && (
                          <span className="ml-2 text-xs text-blue-400 flex items-center gap-1">
                            <Navigation2 size={12} />
                            {((clinic as any).distance).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-light">{clinic.rating}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      ({clinic.reviewCount} yorum)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {clinic.services.slice(0, 3).map((service) => (
                      <span
                        key={service}
                        className="text-xs px-2 py-1 bg-slate-700/30 rounded border border-slate-600/30 text-slate-300"
                      >
                        {service}
                      </span>
                    ))}
                    {clinic.services.length > 3 && (
                      <span className="text-xs px-2 py-1 text-slate-500">
                        +{clinic.services.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-blue-400 group-hover:text-blue-300 transition">
                    <span className="font-light">Detayları Gör</span>
                    <ArrowRight size={16} />
                  </div>
                </Link>
              ))}
            </div>

            {filteredClinics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 font-light mb-4">
                  Aradığınız kriterlere uygun klinik bulunamadı.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function ClinicsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <ClinicsPageContent />
    </Suspense>
  );
}
