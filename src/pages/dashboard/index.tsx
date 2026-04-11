import { useEffect, useState, useContext } from 'react'
import { Container } from "../../components/container";
import { DashboardHeader } from '../../components/panelheader';

import { FiTrash2 } from 'react-icons/fi'

import { collection, getDocs, where, query, doc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../services/firebaseConnection';
import { ref, deleteObject } from 'firebase/storage';
import { AuthContext } from '../../contexts/AuthContext';

interface CarsProps {
  id: string;
  name: string;
  year: string;
  price: string | number;
  city: string;
  km: string;
  images: ImageCarProps[];
  uid: string;
}

interface ImageCarProps {
  name: string;
  uid: string;
  url: string;
}

export function Dashboard() {
  const [cars, setCars] = useState<CarsProps[]>([])
  const [loadImages, setLoadImages] = useState<string[]>([])
  const { user } = useContext(AuthContext);

  useEffect(() => {

    function loadCars() {
      if(!user?.uid) {
        return;
      }

      const carsRef = collection(db, "cars")
      const queryRef = query(carsRef, where("uid", '==', user.uid))

      getDocs(queryRef)
      .then((snapshot) => {
        let listcars = [] as CarsProps[];

        snapshot.forEach( doc => {
          listcars.push({
            id: doc.id,
            name: doc.data().name,
            year: doc.data().year,
            km: doc.data().km,
            city: doc.data().city,
            price: doc.data().price,
            images: doc.data().images,
            uid: doc.data().uid
          })
        })

        setCars(listcars);

      })
    }

    loadCars()

  }, [user])

  function handleImageLoad(id: string) {
    setLoadImages((prevImageLoaded) => [...prevImageLoaded, id])
  }

  async function handleDeleteCar(car: CarsProps) {
    const itemCar = car;

    const docRef = doc(db, "cars", itemCar.id)
    await deleteDoc(docRef);

    itemCar.images.map( async (image) => {
      const imagePath = `images/${image.uid}/${image.name}`
      const imageRef = ref(storage, imagePath)

      try {
        await deleteObject(imageRef)
        setCars(cars.filter(car => car.id !== itemCar.id))
      } catch(error) {
        console.log(error)
      }
    })
  }

  return (
    <Container>
      <DashboardHeader/>

      <main className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 py-5">

        {cars.map( car => (
          <section className="w-full bg-white rounded-lg relative">
          
            <button
              onClick={ () => handleDeleteCar(car) } 
              className="absolute bg-white w-14 h-14 rounded-full flex items-center justify-center right-2 top-2 drop-shadow-lg"
            >
              <FiTrash2 size={26} color="#000"/>
            </button>
            <div 
              className="w-full h-72 rounded-lg bg-slate-200"
              style={{ display: loadImages.includes(car.id) ? "none" : "block" }}  
            >
            </div>
            <img
              className="w-full rounded-lg mb-2 h-72 object-cover"
              src={car.images[0].url}
              alt={car.name}
              onLoad={ () => handleImageLoad(car.id) }
              style={{ display: loadImages.includes(car.id) ? "block" : "none" }}
            />

            <div className="flex flex-col flex-1 px-2">
              <p className="font-bold mt-1 px-2 mb-2">{car.name}</p>

              <div className="flex flex-col px-2">
                <span className="text-zinc-700">
                  Ano {car.year} | {car.km} km
                </span>
                <strong className="text-black font-bold mt-4">
                  R$ {car.price}
                </strong>
              </div>
            </div>

            <div className="w-full h-px bg-slate-200 my-2 mt-auto"></div>

            <div className="px-2 pb-2">
              <span className="text-black">
                {car.city}
              </span>
            </div>

          </section>
        ))}

      </main>
    </Container>
  )
}
