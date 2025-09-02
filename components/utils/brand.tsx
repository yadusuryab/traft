import React from 'react'
import logo from '@/public/stylezone-wordmark.png'
import Image from 'next/image'


function Brand() {
  return (
    <Image src={logo.src} width={80} height={30} alt={process.env.NEXT_PUBLIC_APP_NAME || 'SHOPIGO'} />

  )
}

export default Brand
