'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase/config'
import Image from 'next/image'
import { Car } from '@/lib/types/car'
import { 
  EnvelopeIcon, 
  CalendarIcon, 
  MapPinIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PhoneIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ref, getDownloadURL } from 'firebase/storage'

export default function CarDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [car, setCar] = useState<Car | null>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showLightbox, setShowLightbox] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  useEffect(() => {
    async function fetchCar() {
      if (!params.id) {
        router.push('/')
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        setImageLoadError(false)

        const carDoc = await getDoc(doc(db, 'cars', params.id as string))
        
        if (!carDoc.exists()) {
          setError('Car not found')
          return
        }

        const carData = { id: carDoc.id, ...carDoc.data() } as Car
        setCar(carData)

        if (carData.imagePaths?.length) {
          try {
            const urls = await Promise.all(
              carData.imagePaths.map(async path => {
                try {
                  return await getDownloadURL(ref(storage, path))
                } catch (err) {
                  console.error(`Error fetching image URL for path ${path}:`, err)
                  return null
                }
              })
            )
            setImageUrls(urls.filter(Boolean) as string[])
          } catch (err) {
            console.error('Error fetching image URLs:', err)
            setImageLoadError(true)
          }
        }
      } catch (err) {
        console.error('Error fetching car:', err)
        setError('Failed to load car details')
      } finally {
        setLoading(false)
      }
    }

    fetchCar()
  }, [params.id, router])

  const handleImageError = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === imageUrls.length - 1 ? 0 : prev + 1
    )
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? imageUrls.length - 1 : prev - 1
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <div className="h-[300px] sm:h-[600px] bg-gray-100 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <InformationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">{error}</h2>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  if (!car) return null

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative h-[300px] sm:h-[600px] rounded-xl overflow-hidden group">
            {imageUrls.length > 0 ? (
              <>
                <Image
                  src={imageUrls[currentImageIndex]}
                  alt={`${car.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  priority
                  onClick={() => setShowLightbox(true)}
                  onError={() => handleImageError(currentImageIndex)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={75}
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        previousImage()
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                {imageLoadError ? 'Failed to load images' : 'No images available'}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {imageUrls.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {imageUrls.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    index === currentImageIndex 
                      ? 'ring-2 ring-amber-500 ring-offset-2' 
                      : 'hover:opacity-80'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 8vw"
                    quality={50}
                    onError={() => handleImageError(index)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Car Details */}
        <div className="space-y-6 sm:space-y-8">
          <div>
            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{car.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                car.status === 'available' 
                  ? 'bg-green-100 text-green-800'
                  : car.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-amber-600">
              ₹{car.price.toLocaleString()}
            </p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Year</span>
              </div>
              <p className="text-lg text-gray-700">{car.year}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <MapPinIcon className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-lg text-gray-700">{car.tel}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-amber-600" />
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {car.info}
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-amber-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <a 
                href={`mailto:${car.email}`}
                className="flex items-center gap-3 w-full p-3 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EnvelopeIcon className="h-5 w-5 text-amber-600" />
                {car.email}
              </a>
              <a 
                href={`tel:${car.tel}`}
                className="flex items-center gap-3 w-full p-3 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PhoneIcon className="h-5 w-5 text-amber-600" />
                {car.tel}
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href={`mailto:${car.email}`}
              className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg text-center hover:bg-amber-700 transition-colors"
            >
              Contact Seller
            </a>
            <Link 
              href="/"
              className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-center hover:bg-gray-50 transition-colors"
            >
              Back to Listings
            </Link>
          </div>
        </div>
      </div>

      {/* Simple Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute right-4 top-4 text-white hover:text-gray-300 p-2"
            >
              <span className="text-2xl">×</span>
            </button>
            <Image
              src={imageUrls[currentImageIndex]}
              alt={`${car.name} - Image ${currentImageIndex + 1}`}
              width={1200}
              height={800}
              className="object-contain"
              priority
              quality={90}
              onClick={(e) => e.stopPropagation()}
            />
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    previousImage()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}