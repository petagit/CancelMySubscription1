import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getPosts, stripHtml, type WPPost } from "@/lib/wordpress-api";

export default function Blog() {
  const [page, setPage] = useState(1);
  
  const { data: posts, isLoading, isError } = useQuery<WPPost[]>({
    queryKey: ["blog-posts", page],
    queryFn: async () => {
      try {
        return await getPosts(page);
      } catch (error) {
        console.error("Error fetching WordPress posts:", error);
        return [];
      }
    },
    // Enabled - connected to the WordPress API
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Easy Guide:</h1>
        <p className="text-lg text-black mb-6">
          The simpliest way to cancel subscription for everything. <a href="#" className="text-blue-600 hover:underline">Read more.</a>
        </p>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : isError ? (
          <div className="bg-white border border-black p-6 rounded-lg my-8 text-center">
            <h3 className="text-xl font-bold mb-2 text-black">Unable to load blog posts</h3>
            <p className="text-black">Please check back later</p>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="bg-white border border-black p-6 rounded-lg my-8 text-center">
            <h3 className="text-xl font-bold mb-2 text-black">Coming Soon</h3>
            <p className="text-black">Our blog is currently under construction. Please check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-black rounded-lg overflow-hidden">
                {post._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={post._embedded["wp:featuredmedia"][0].source_url} 
                      alt={post.title.rendered}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-sm text-gray-700 mb-2">{formatDate(new Date(post.date))}</p>
                  <h3 className="text-xl font-bold mb-2 text-black">{post.title.rendered}</h3>
                  <div className="text-black mb-4">
                    {stripHtml(post.excerpt.rendered)}
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <Button className="bg-black text-white hover:bg-gray-800">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}